/**
 * Admin Salesperson Payouts API
 * GET/POST /api/admin/salesperson-payouts
 * Vercel Serverless Function
 *
 * Manage salesperson payouts
 */

const { Pool } = require('pg');
const { setCorsHeaders, handlePreflight, verifyAdminToken } = require('../lib/security');

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
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // Get pending payouts by salesperson
      const pendingResult = await dbPool.query(`
        SELECT
          s.id as salesperson_id,
          s.code, s.name, s.email,
          sms.year_month,
          sms.total_payments,
          sms.total_revenue,
          sms.royalty_amount
        FROM salesperson_monthly_stats sms
        JOIN salespersons s ON sms.salesperson_id = s.id
        WHERE sms.payout_status = 'pending' AND s.status != 'deleted'
        ORDER BY s.name, sms.year_month
      `);

      // Get all monthly stats
      const allStatsResult = await dbPool.query(`
        SELECT
          sms.id,
          s.id as salesperson_id,
          s.code, s.name,
          sms.year_month,
          sms.total_payments,
          sms.total_revenue,
          sms.royalty_amount,
          sms.payout_status,
          sms.paid_at,
          sms.exchange_rate_jpy,
          sms.transfer_fee_jpy,
          sms.net_payout_jpy
        FROM salesperson_monthly_stats sms
        JOIN salespersons s ON sms.salesperson_id = s.id
        WHERE s.status != 'deleted'
        ORDER BY sms.year_month DESC, s.name
        LIMIT 100
      `);

      // Get summary
      const summaryResult = await dbPool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN payout_status = 'pending' THEN royalty_amount ELSE 0 END), 0) as total_pending,
          COALESCE(SUM(CASE WHEN payout_status = 'paid' THEN royalty_amount ELSE 0 END), 0) as total_paid,
          COUNT(DISTINCT CASE WHEN payout_status = 'pending' THEN salesperson_id END) as salespersons_pending
        FROM salesperson_monthly_stats sms
        JOIN salespersons s ON sms.salesperson_id = s.id
        WHERE s.status != 'deleted'
      `);

      // Group pending by salesperson
      const pendingByPerson = {};
      for (const row of pendingResult.rows) {
        if (!pendingByPerson[row.salesperson_id]) {
          pendingByPerson[row.salesperson_id] = {
            salesperson_id: row.salesperson_id,
            code: row.code,
            name: row.name,
            email: row.email,
            months: [],
            total_royalty: 0
          };
        }
        pendingByPerson[row.salesperson_id].months.push({
          year_month: row.year_month,
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          royalty_amount: parseFloat(row.royalty_amount)
        });
        pendingByPerson[row.salesperson_id].total_royalty += parseFloat(row.royalty_amount);
      }

      return res.json({
        success: true,
        summary: {
          total_pending: parseFloat(summaryResult.rows[0].total_pending),
          total_paid: parseFloat(summaryResult.rows[0].total_paid),
          salespersons_pending: parseInt(summaryResult.rows[0].salespersons_pending)
        },
        pending_payouts: Object.values(pendingByPerson),
        all_stats: allStatsResult.rows.map(row => ({
          ...row,
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          royalty_amount: parseFloat(row.royalty_amount)
        }))
      });

    } else if (req.method === 'POST') {
      // Process payout
      const { salesperson_id, year_months, exchange_rate_jpy, transfer_fee_jpy } = req.body;

      if (!salesperson_id || !year_months || !Array.isArray(year_months) || year_months.length === 0) {
        return res.status(400).json({
          error: { message: 'salesperson_id and year_months array are required' }
        });
      }

      if (!exchange_rate_jpy || exchange_rate_jpy <= 0) {
        return res.status(400).json({
          error: { message: 'exchange_rate_jpy is required and must be positive' }
        });
      }

      // Get total royalty for selected months
      const totalResult = await dbPool.query(`
        SELECT COALESCE(SUM(royalty_amount), 0) as total
        FROM salesperson_monthly_stats
        WHERE salesperson_id = $1 AND year_month = ANY($2) AND payout_status = 'pending'
      `, [salesperson_id, year_months]);

      const totalRoyaltyUsd = parseFloat(totalResult.rows[0].total);
      if (totalRoyaltyUsd <= 0) {
        return res.status(400).json({
          error: { message: 'No pending royalty for selected months' }
        });
      }

      // Calculate payout amounts
      const grossJpy = Math.round(totalRoyaltyUsd * exchange_rate_jpy);
      const fee = parseInt(transfer_fee_jpy) || 0;
      const netJpy = grossJpy - fee;

      // Update monthly stats to paid
      await dbPool.query(`
        UPDATE salesperson_monthly_stats
        SET
          payout_status = 'paid',
          paid_at = NOW(),
          exchange_rate_jpy = $3,
          transfer_fee_jpy = $4,
          net_payout_jpy = $5,
          updated_at = NOW()
        WHERE salesperson_id = $1 AND year_month = ANY($2) AND payout_status = 'pending'
      `, [salesperson_id, year_months, exchange_rate_jpy, fee, netJpy]);

      return res.json({
        success: true,
        payout: {
          salesperson_id,
          year_months,
          total_royalty_usd: totalRoyaltyUsd,
          exchange_rate_jpy,
          gross_jpy: grossJpy,
          transfer_fee_jpy: fee,
          net_payout_jpy: netJpy
        }
      });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Salesperson payouts API error:', error);
    return res.status(500).json({
      error: { message: error.message || 'Internal server error' }
    });
  }
};
