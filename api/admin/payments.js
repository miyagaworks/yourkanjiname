/**
 * Admin Payments API
 * GET /api/admin/payments
 * Vercel Serverless Function
 *
 * List all payments with filtering and statistics
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  if (!verifyToken(req)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const dbPool = getPool();

  try {
    // Query params for filtering
    const {
      status,
      partner_id,
      start_date,
      end_date,
      limit = '100',
      offset = '0'
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const values = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      conditions.push(`pay.status = $${paramCount}`);
      values.push(status);
    }

    if (partner_id) {
      paramCount++;
      conditions.push(`pay.partner_id = $${paramCount}`);
      values.push(parseInt(partner_id, 10));
    }

    if (start_date) {
      paramCount++;
      conditions.push(`pay.created_at >= $${paramCount}`);
      values.push(start_date);
    }

    if (end_date) {
      paramCount++;
      conditions.push(`pay.created_at <= $${paramCount}`);
      values.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get payments with partner info
    paramCount++;
    const limitParam = paramCount;
    values.push(parseInt(limit, 10));

    paramCount++;
    const offsetParam = paramCount;
    values.push(parseInt(offset, 10));

    const paymentsQuery = `
      SELECT
        pay.id, pay.session_id, pay.stripe_payment_intent_id, pay.amount,
        pay.currency, pay.status, pay.partner_code, pay.partner_id,
        pay.customer_email, pay.kanji_name, pay.created_at,
        p.name as partner_name, p.royalty_rate
      FROM payments pay
      LEFT JOIN partners p ON pay.partner_id = p.id
      ${whereClause}
      ORDER BY pay.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const paymentsResult = await dbPool.query(paymentsQuery, values);

    // Get total count
    const countValues = values.slice(0, -2); // Remove limit and offset
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments pay
      ${whereClause}
    `;

    const countResult = await dbPool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get summary statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_count,
        COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as succeeded_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_count,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'succeeded' AND partner_id IS NOT NULL THEN amount ELSE 0 END), 0) as partner_revenue,
        COUNT(CASE WHEN status = 'succeeded' AND partner_id IS NOT NULL THEN 1 END) as partner_payments
      FROM payments
    `;

    const statsResult = await dbPool.query(statsQuery);
    const stats = statsResult.rows[0];

    // Get current month stats
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyStatsQuery = `
      SELECT
        COUNT(*) as month_count,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as month_revenue
      FROM payments
      WHERE TO_CHAR(created_at, 'YYYY-MM') = $1
    `;

    const monthlyStatsResult = await dbPool.query(monthlyStatsQuery, [currentMonth]);
    const monthlyStats = monthlyStatsResult.rows[0];

    return res.json({
      success: true,
      payments: paymentsResult.rows.map(row => ({
        id: row.id,
        session_id: row.session_id,
        stripe_payment_intent_id: row.stripe_payment_intent_id,
        amount: parseFloat(row.amount),
        currency: row.currency,
        status: row.status,
        partner_code: row.partner_code,
        partner_id: row.partner_id,
        partner_name: row.partner_name,
        royalty_rate: row.royalty_rate ? parseFloat(row.royalty_rate) : null,
        royalty_amount: row.royalty_rate ? parseFloat(row.amount) * parseFloat(row.royalty_rate) : null,
        customer_email: row.customer_email,
        kanji_name: row.kanji_name,
        created_at: row.created_at
      })),
      pagination: {
        total,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      },
      stats: {
        all_time: {
          total_count: parseInt(stats.total_count),
          succeeded_count: parseInt(stats.succeeded_count),
          pending_count: parseInt(stats.pending_count),
          failed_count: parseInt(stats.failed_count),
          refunded_count: parseInt(stats.refunded_count),
          total_revenue: parseFloat(stats.total_revenue),
          partner_revenue: parseFloat(stats.partner_revenue),
          partner_payments: parseInt(stats.partner_payments)
        },
        current_month: {
          year_month: currentMonth,
          count: parseInt(monthlyStats.month_count),
          revenue: parseFloat(monthlyStats.month_revenue)
        }
      }
    });

  } catch (error) {
    console.error('Admin payments error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' }
    });
  }
};
