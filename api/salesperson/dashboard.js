/**
 * Salesperson Dashboard API
 * GET /api/salesperson/dashboard
 * Vercel Serverless Function
 *
 * Returns salesperson's partners, stats, and royalty information
 */

const crypto = require('crypto');
const { Pool } = require('pg');
const { setCorsHeaders, handlePreflight } = require('../lib/security');

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
 * Verify salesperson token and return salesperson ID
 */
function verifySalespersonToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  // Token format: sp_{salespersonId}.{tokenValue}.{hmacHashPrefix}
  if (!token.startsWith('sp_')) {
    return null;
  }

  const parts = token.substring(3).split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [salespersonId, tokenValue, hashPrefix] = parts;

  // Verify HMAC
  const expectedHash = crypto.createHmac('sha256', tokenValue)
    .update(salespersonId)
    .digest('hex');

  if (expectedHash.substring(0, 16) !== hashPrefix) {
    return null;
  }

  return parseInt(salespersonId, 10);
}

/**
 * Check if salesperson contract is still active for a partner
 */
function isContractActive(contractStart, contractMonths) {
  if (!contractStart || !contractMonths) return false;

  const startDate = new Date(contractStart);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + parseInt(contractMonths, 10));

  return new Date() < endDate;
}

/**
 * Calculate remaining months in contract
 */
function getRemainingMonths(contractStart, contractMonths) {
  if (!contractStart || !contractMonths) return 0;

  const startDate = new Date(contractStart);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + parseInt(contractMonths, 10));

  const now = new Date();
  if (now >= endDate) return 0;

  const diffTime = endDate - now;
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return diffMonths;
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify salesperson token
  const salespersonId = verifySalespersonToken(req.headers.authorization);
  if (!salespersonId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' }
    });
  }

  const dbPool = getPool();

  try {
    // Get salesperson info
    const salespersonResult = await dbPool.query(`
      SELECT id, code, name, email, royalty_rate, status
      FROM salespersons
      WHERE id = $1 AND status = 'active'
    `, [salespersonId]);

    if (salespersonResult.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Salesperson not found' }
      });
    }

    const salesperson = salespersonResult.rows[0];

    // Get partners referred by this salesperson
    const partnersResult = await dbPool.query(`
      SELECT
        p.id, p.code, p.name, p.status,
        p.salesperson_contract_start, p.salesperson_contract_months,
        COALESCE(stats.total_payments, 0) as total_payments,
        COALESCE(stats.total_revenue, 0) as total_revenue
      FROM partners p
      LEFT JOIN (
        SELECT
          partner_id,
          SUM(total_payments) as total_payments,
          SUM(total_revenue) as total_revenue
        FROM partner_monthly_stats
        GROUP BY partner_id
      ) stats ON p.id = stats.partner_id
      WHERE p.salesperson_id = $1 AND p.status != 'deleted'
      ORDER BY p.created_at DESC
    `, [salespersonId]);

    // Get monthly stats for salesperson
    const monthlyStatsResult = await dbPool.query(`
      SELECT
        year_month, total_payments, total_revenue, royalty_amount, payout_status, paid_at
      FROM salesperson_monthly_stats
      WHERE salesperson_id = $1
      ORDER BY year_month DESC
      LIMIT 12
    `, [salespersonId]);

    // Get summary stats
    const summaryResult = await dbPool.query(`
      SELECT
        COALESCE(SUM(total_payments), 0) as total_payments,
        COALESCE(SUM(total_revenue), 0) as total_revenue,
        COALESCE(SUM(royalty_amount), 0) as total_royalty,
        COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN royalty_amount ELSE 0 END), 0) as pending_royalty
      FROM salesperson_monthly_stats
      WHERE salesperson_id = $1
    `, [salespersonId]);

    // Get current month stats
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthResult = await dbPool.query(`
      SELECT
        COALESCE(total_payments, 0) as total_payments,
        COALESCE(total_revenue, 0) as total_revenue,
        COALESCE(royalty_amount, 0) as royalty_amount
      FROM salesperson_monthly_stats
      WHERE salesperson_id = $1 AND year_month = $2
    `, [salespersonId, currentMonth]);

    const summary = summaryResult.rows[0];
    const currentMonthStats = currentMonthResult.rows[0] || {
      total_payments: 0,
      total_revenue: 0,
      royalty_amount: 0
    };

    // Format partners with contract status
    const partners = partnersResult.rows.map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      status: p.status,
      contract_start: p.salesperson_contract_start,
      contract_months: p.salesperson_contract_months,
      is_active: isContractActive(p.salesperson_contract_start, p.salesperson_contract_months),
      remaining_months: getRemainingMonths(p.salesperson_contract_start, p.salesperson_contract_months),
      total_payments: parseInt(p.total_payments),
      total_revenue: parseFloat(p.total_revenue)
    }));

    return res.json({
      success: true,
      salesperson: {
        id: salesperson.id,
        code: salesperson.code,
        name: salesperson.name,
        royalty_rate: parseFloat(salesperson.royalty_rate)
      },
      summary: {
        partner_count: partners.length,
        active_partner_count: partners.filter(p => p.is_active).length,
        total_payments: parseInt(summary.total_payments),
        total_revenue: parseFloat(summary.total_revenue),
        total_royalty: parseFloat(summary.total_royalty),
        pending_royalty: parseFloat(summary.pending_royalty)
      },
      current_month: {
        year_month: currentMonth,
        total_payments: parseInt(currentMonthStats.total_payments),
        total_revenue: parseFloat(currentMonthStats.total_revenue),
        royalty_amount: parseFloat(currentMonthStats.royalty_amount)
      },
      partners: partners,
      monthly_stats: monthlyStatsResult.rows.map(row => ({
        year_month: row.year_month,
        total_payments: parseInt(row.total_payments),
        total_revenue: parseFloat(row.total_revenue),
        royalty_amount: parseFloat(row.royalty_amount),
        payout_status: row.payout_status,
        paid_at: row.paid_at
      }))
    });

  } catch (error) {
    console.error('Salesperson dashboard error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  }
};
