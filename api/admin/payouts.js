/**
 * Admin Payouts API
 * GET/POST /api/admin/payouts
 * Vercel Serverless Function
 *
 * Manage partner payouts
 */

const { Pool } = require('pg');
const crypto = require('crypto');

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

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  const [tokenValue, tokenHash] = token.split('.');

  if (!tokenValue || !tokenHash) {
    return false;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const expectedHash = crypto.createHash('sha256')
    .update(tokenValue + adminPassword)
    .digest('hex')
    .substring(0, 16);

  return tokenHash === expectedHash;
}

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication
  if (!verifyToken(req)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // Get pending payouts grouped by partner
      const pendingResult = await dbPool.query(`
        SELECT
          p.id as partner_id,
          p.code,
          p.name,
          p.email,
          p.bank_name,
          p.bank_account,
          p.royalty_rate,
          COALESCE(SUM(pms.total_payments), 0) as total_payments,
          COALESCE(SUM(pms.total_revenue), 0) as total_revenue,
          COALESCE(SUM(pms.royalty_amount), 0) as pending_royalty,
          array_agg(pms.year_month ORDER BY pms.year_month DESC) as pending_months
        FROM partners p
        JOIN partner_monthly_stats pms ON p.id = pms.partner_id
        WHERE pms.payout_status = 'pending'
        GROUP BY p.id
        ORDER BY pending_royalty DESC
      `);

      // Get all monthly stats for the detail view
      const allStatsResult = await dbPool.query(`
        SELECT
          pms.id,
          pms.partner_id,
          pms.year_month,
          pms.total_payments,
          pms.total_revenue,
          pms.royalty_amount,
          pms.payout_status,
          pms.paid_at,
          p.name as partner_name,
          p.code as partner_code
        FROM partner_monthly_stats pms
        JOIN partners p ON pms.partner_id = p.id
        ORDER BY pms.year_month DESC, p.name ASC
        LIMIT 200
      `);

      // Get payout summary
      const summaryResult = await dbPool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN royalty_amount ELSE 0 END), 0) as total_pending,
          COALESCE(SUM(CASE WHEN payout_status = 'paid' THEN royalty_amount ELSE 0 END), 0) as total_paid,
          COUNT(DISTINCT CASE WHEN payout_status = 'pending' THEN partner_id END) as partners_pending
        FROM partner_monthly_stats
      `);

      const summary = summaryResult.rows[0];

      return res.json({
        success: true,
        pending_payouts: pendingResult.rows.map(row => ({
          partner_id: row.partner_id,
          code: row.code,
          name: row.name,
          email: row.email,
          bank_name: row.bank_name,
          bank_account: row.bank_account,
          royalty_rate: parseFloat(row.royalty_rate),
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          pending_royalty: parseFloat(row.pending_royalty),
          pending_months: row.pending_months.filter(m => m !== null)
        })),
        all_stats: allStatsResult.rows.map(row => ({
          id: row.id,
          partner_id: row.partner_id,
          partner_name: row.partner_name,
          partner_code: row.partner_code,
          year_month: row.year_month,
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          royalty_amount: parseFloat(row.royalty_amount),
          payout_status: row.payout_status,
          paid_at: row.paid_at
        })),
        summary: {
          total_pending: parseFloat(summary.total_pending),
          total_paid: parseFloat(summary.total_paid),
          partners_pending: parseInt(summary.partners_pending)
        }
      });

    } else if (req.method === 'POST') {
      // Mark payouts as paid
      const { partner_id, year_months } = req.body;

      if (!partner_id) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUEST', message: 'partner_id is required' }
        });
      }

      if (!year_months || !Array.isArray(year_months) || year_months.length === 0) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUEST', message: 'year_months array is required' }
        });
      }

      // Mark as paid
      const result = await dbPool.query(`
        UPDATE partner_monthly_stats
        SET payout_status = 'paid', paid_at = NOW(), updated_at = NOW()
        WHERE partner_id = $1 AND year_month = ANY($2) AND payout_status = 'pending'
        RETURNING id, year_month, royalty_amount
      `, [partner_id, year_months]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'No pending payouts found for specified months' }
        });
      }

      const totalPaid = result.rows.reduce((sum, row) => sum + parseFloat(row.royalty_amount), 0);

      return res.json({
        success: true,
        message: `Marked ${result.rows.length} month(s) as paid`,
        paid_months: result.rows.map(row => ({
          id: row.id,
          year_month: row.year_month,
          royalty_amount: parseFloat(row.royalty_amount)
        })),
        total_paid: totalPaid
      });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Admin payouts error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' }
    });
  }
};
