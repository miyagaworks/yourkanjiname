/**
 * Admin Stats API
 * GET /api/admin/stats
 * Vercel Serverless Function
 *
 * Get overall sales and partner statistics
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
    // Overall payment stats
    const overallStatsResult = await dbPool.query(`
      SELECT
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as succeeded_payments,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'succeeded' THEN amount ELSE NULL END), 0) as avg_payment
      FROM payments
    `);

    // Partner stats
    const partnerStatsResult = await dbPool.query(`
      SELECT
        COUNT(*) as total_partners,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_partners
      FROM partners
    `);

    // Revenue by partner vs direct
    const revenueBySourceResult = await dbPool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN partner_id IS NOT NULL AND status = 'succeeded' THEN amount ELSE 0 END), 0) as partner_revenue,
        COALESCE(SUM(CASE WHEN partner_id IS NULL AND status = 'succeeded' THEN amount ELSE 0 END), 0) as direct_revenue,
        COUNT(CASE WHEN partner_id IS NOT NULL AND status = 'succeeded' THEN 1 END) as partner_payments,
        COUNT(CASE WHEN partner_id IS NULL AND status = 'succeeded' THEN 1 END) as direct_payments
      FROM payments
    `);

    // Monthly revenue trend (last 12 months)
    const monthlyTrendResult = await dbPool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as year_month,
        COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as payments,
        COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as revenue,
        COUNT(CASE WHEN partner_id IS NOT NULL AND status = 'succeeded' THEN 1 END) as partner_payments,
        COALESCE(SUM(CASE WHEN partner_id IS NOT NULL AND status = 'succeeded' THEN amount ELSE 0 END), 0) as partner_revenue
      FROM payments
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY year_month DESC
    `);

    // Top performing partners
    const topPartnersResult = await dbPool.query(`
      SELECT
        p.id,
        p.code,
        p.name,
        COUNT(pay.id) as payment_count,
        COALESCE(SUM(pay.amount), 0) as total_revenue,
        COALESCE(SUM(pay.amount * p.royalty_rate), 0) as total_royalty
      FROM partners p
      JOIN payments pay ON p.id = pay.partner_id AND pay.status = 'succeeded'
      GROUP BY p.id
      ORDER BY total_revenue DESC
      LIMIT 10
    `);

    // Pending royalties
    const pendingRoyaltiesResult = await dbPool.query(`
      SELECT
        COALESCE(SUM(royalty_amount), 0) as total_pending
      FROM partner_monthly_stats
      WHERE payout_status = 'pending'
    `);

    const overallStats = overallStatsResult.rows[0];
    const partnerStats = partnerStatsResult.rows[0];
    const revenueBySource = revenueBySourceResult.rows[0];
    const pendingRoyalties = pendingRoyaltiesResult.rows[0];

    return res.json({
      success: true,
      stats: {
        overall: {
          total_payments: parseInt(overallStats.total_payments),
          succeeded_payments: parseInt(overallStats.succeeded_payments),
          total_revenue: parseFloat(overallStats.total_revenue),
          avg_payment: parseFloat(overallStats.avg_payment)
        },
        partners: {
          total_partners: parseInt(partnerStats.total_partners),
          active_partners: parseInt(partnerStats.active_partners)
        },
        revenue_by_source: {
          partner_revenue: parseFloat(revenueBySource.partner_revenue),
          direct_revenue: parseFloat(revenueBySource.direct_revenue),
          partner_payments: parseInt(revenueBySource.partner_payments),
          direct_payments: parseInt(revenueBySource.direct_payments),
          partner_percentage: overallStats.total_revenue > 0
            ? (parseFloat(revenueBySource.partner_revenue) / parseFloat(overallStats.total_revenue) * 100).toFixed(1)
            : 0
        },
        pending_royalties: parseFloat(pendingRoyalties.total_pending),
        monthly_trend: monthlyTrendResult.rows.map(row => ({
          year_month: row.year_month,
          payments: parseInt(row.payments),
          revenue: parseFloat(row.revenue),
          partner_payments: parseInt(row.partner_payments),
          partner_revenue: parseFloat(row.partner_revenue)
        })),
        top_partners: topPartnersResult.rows.map(row => ({
          id: row.id,
          code: row.code,
          name: row.name,
          payment_count: parseInt(row.payment_count),
          total_revenue: parseFloat(row.total_revenue),
          total_royalty: parseFloat(row.total_royalty)
        }))
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' }
    });
  }
};
