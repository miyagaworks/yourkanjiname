/**
 * Partner Dashboard API
 * GET /api/partner/dashboard
 * Vercel Serverless Function
 *
 * Returns dashboard data for the logged-in partner
 */

const crypto = require('crypto');
const { Pool } = require('pg');

// Initialize database pool
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

/**
 * Verify partner token
 */
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [partnerId, tokenValue, tokenHashPart] = parts;

  // Verify token hash
  const expectedHash = crypto.createHash('sha256')
    .update(tokenValue + partnerId)
    .digest('hex');

  if (!expectedHash.startsWith(tokenHashPart)) {
    return null;
  }

  return parseInt(partnerId, 10);
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  const partnerId = verifyToken(req.headers.authorization);
  if (!partnerId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    });
  }

  try {
    const dbPool = getPool();

    // Get partner info
    const partnerResult = await dbPool.query(
      `SELECT id, code, name, email, contact_name, phone, address,
              bank_name, bank_account, royalty_rate, status, created_at
       FROM partners WHERE id = $1`,
      [partnerId]
    );

    if (partnerResult.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Partner not found' }
      });
    }

    const partner = partnerResult.rows[0];

    // Get current month stats
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthStatsResult = await dbPool.query(
      `SELECT total_payments, total_revenue, royalty_amount, payout_status
       FROM partner_monthly_stats
       WHERE partner_id = $1 AND year_month = $2`,
      [partnerId, currentMonth]
    );

    const currentMonthStats = currentMonthStatsResult.rows[0] || {
      total_payments: 0,
      total_revenue: 0,
      royalty_amount: 0,
      payout_status: 'pending'
    };

    // Get all-time totals
    const allTimeResult = await dbPool.query(
      `SELECT
         COUNT(*) as total_payments,
         COALESCE(SUM(amount), 0) as total_revenue
       FROM payments
       WHERE partner_id = $1 AND status = 'succeeded'`,
      [partnerId]
    );

    const allTimeStats = allTimeResult.rows[0];

    // Calculate all-time royalty
    const allTimeRoyalty = parseFloat(allTimeStats.total_revenue) * parseFloat(partner.royalty_rate);

    // Get pending royalty (unpaid months)
    const pendingRoyaltyResult = await dbPool.query(
      `SELECT COALESCE(SUM(royalty_amount), 0) as pending_royalty
       FROM partner_monthly_stats
       WHERE partner_id = $1 AND payout_status = 'pending'`,
      [partnerId]
    );

    const pendingRoyalty = parseFloat(pendingRoyaltyResult.rows[0].pending_royalty) || 0;

    // Get monthly history (last 12 months)
    const monthlyHistoryResult = await dbPool.query(
      `SELECT year_month, total_payments, total_revenue, royalty_amount, payout_status, paid_at
       FROM partner_monthly_stats
       WHERE partner_id = $1
       ORDER BY year_month DESC
       LIMIT 12`,
      [partnerId]
    );

    // Get recent payments
    const recentPaymentsResult = await dbPool.query(
      `SELECT id, amount, status, kanji_name, created_at
       FROM payments
       WHERE partner_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [partnerId]
    );

    // Generate QR code URL
    const qrCodeUrl = `https://yourkanjiname.com?ref=${partner.code}`;

    return res.json({
      partner: {
        id: partner.id,
        code: partner.code,
        name: partner.name,
        email: partner.email,
        contact_name: partner.contact_name,
        royalty_rate: parseFloat(partner.royalty_rate),
        created_at: partner.created_at
      },
      stats: {
        current_month: {
          year_month: currentMonth,
          payments: parseInt(currentMonthStats.total_payments),
          revenue: parseFloat(currentMonthStats.total_revenue),
          royalty: parseFloat(currentMonthStats.royalty_amount),
          payout_status: currentMonthStats.payout_status
        },
        all_time: {
          payments: parseInt(allTimeStats.total_payments),
          revenue: parseFloat(allTimeStats.total_revenue),
          royalty: allTimeRoyalty
        },
        pending_royalty: pendingRoyalty
      },
      monthly_history: monthlyHistoryResult.rows.map(row => ({
        year_month: row.year_month,
        payments: parseInt(row.total_payments),
        revenue: parseFloat(row.total_revenue),
        royalty: parseFloat(row.royalty_amount),
        payout_status: row.payout_status,
        paid_at: row.paid_at
      })),
      recent_payments: recentPaymentsResult.rows.map(row => ({
        id: row.id,
        amount: parseFloat(row.amount),
        status: row.status,
        kanji_name: row.kanji_name,
        created_at: row.created_at
      })),
      qr_code_url: qrCodeUrl
    });

  } catch (error) {
    console.error('Partner dashboard error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  }
};
