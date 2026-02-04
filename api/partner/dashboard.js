/**
 * Partner Dashboard API
 * GET /api/partner/dashboard
 * Vercel Serverless Function
 *
 * Returns dashboard data for the logged-in partner
 */

const { Pool } = require('pg');
const { setCorsHeaders, handlePreflight, verifyPartnerToken } = require('../_utils/security');

// Cache for exchange rate (5 minutes)
let exchangeRateCache = { rate: null, timestamp: 0 };
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch USD to JPY exchange rate from Frankfurter API (ECB rates)
 */
async function getExchangeRate() {
  const now = Date.now();

  // Return cached rate if still valid
  if (exchangeRateCache.rate && (now - exchangeRateCache.timestamp) < CACHE_DURATION) {
    return exchangeRateCache.rate;
  }

  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=JPY');
    const data = await response.json();

    if (data.rates && data.rates.JPY) {
      exchangeRateCache = { rate: data.rates.JPY, timestamp: now };
      return data.rates.JPY;
    }
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
  }

  // Fallback rate if API fails
  return exchangeRateCache.rate || 150;
}

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

module.exports = async function handler(req, res) {
  // CORS headers with origin whitelist
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  const partnerId = verifyPartnerToken(req.headers.authorization);
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

    // Get monthly history (all months)
    const monthlyHistoryResult = await dbPool.query(
      `SELECT year_month, total_payments, total_revenue, royalty_amount, payout_status, paid_at,
              exchange_rate_jpy, transfer_fee_jpy, net_payout_jpy
       FROM partner_monthly_stats
       WHERE partner_id = $1
       ORDER BY year_month DESC`,
      [partnerId]
    );

    // Get payments with pagination - exclude pending payments
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const countResult = await dbPool.query(
      `SELECT COUNT(*) as total FROM payments WHERE partner_id = $1 AND status != 'pending'`,
      [partnerId]
    );
    const totalPayments = parseInt(countResult.rows[0].total);

    // Get paginated payments
    const allPaymentsResult = await dbPool.query(
      `SELECT id, amount, status, kanji_name, customer_email, created_at
       FROM payments
       WHERE partner_id = $1 AND status != 'pending'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [partnerId, limit, offset]
    );

    // Get recent payments (for quick view) - exclude pending payments
    const recentPaymentsResult = await dbPool.query(
      `SELECT id, amount, status, kanji_name, created_at
       FROM payments
       WHERE partner_id = $1 AND status != 'pending'
       ORDER BY created_at DESC
       LIMIT 10`,
      [partnerId]
    );

    // Generate QR code URL
    const qrCodeUrl = `https://app.kanjiname.jp/?ref=${partner.code}`;

    // Get current exchange rate
    const exchangeRate = await getExchangeRate();

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
        paid_at: row.paid_at,
        exchange_rate_jpy: row.exchange_rate_jpy ? parseFloat(row.exchange_rate_jpy) : null,
        transfer_fee_jpy: row.transfer_fee_jpy ? parseInt(row.transfer_fee_jpy) : null,
        net_payout_jpy: row.net_payout_jpy ? parseInt(row.net_payout_jpy) : null
      })),
      all_payments: {
        data: allPaymentsResult.rows.map(row => ({
          id: row.id,
          amount: parseFloat(row.amount),
          status: row.status,
          kanji_name: row.kanji_name,
          customer_email: row.customer_email,
          created_at: row.created_at
        })),
        pagination: {
          page,
          limit,
          total: totalPayments,
          total_pages: Math.ceil(totalPayments / limit)
        }
      },
      recent_payments: recentPaymentsResult.rows.map(row => ({
        id: row.id,
        amount: parseFloat(row.amount),
        status: row.status,
        kanji_name: row.kanji_name,
        created_at: row.created_at
      })),
      qr_code_url: qrCodeUrl,
      exchange_rate: {
        usd_jpy: exchangeRate,
        source: 'ECB (Frankfurter API)',
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Partner dashboard error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  }
};
