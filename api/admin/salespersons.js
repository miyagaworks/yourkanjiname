/**
 * Admin Salespersons API
 * GET/POST /api/admin/salespersons
 * Vercel Serverless Function
 *
 * Manage salespersons (list and create)
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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
      // List all salespersons with stats
      const result = await dbPool.query(`
        SELECT
          s.id, s.code, s.name, s.email, s.phone, s.royalty_rate, s.status,
          s.created_at, s.updated_at,
          COALESCE(partner_count.count, 0) as partner_count,
          COALESCE(stats.total_payments, 0) as total_payments,
          COALESCE(stats.total_revenue, 0) as total_revenue,
          COALESCE(stats.total_royalty, 0) as total_royalty,
          COALESCE(stats.pending_royalty, 0) as pending_royalty
        FROM salespersons s
        LEFT JOIN (
          SELECT salesperson_id, COUNT(*) as count
          FROM partners
          WHERE salesperson_id IS NOT NULL AND status != 'deleted'
          GROUP BY salesperson_id
        ) partner_count ON s.id = partner_count.salesperson_id
        LEFT JOIN (
          SELECT
            salesperson_id,
            SUM(total_payments) as total_payments,
            SUM(total_revenue) as total_revenue,
            SUM(royalty_amount) as total_royalty,
            SUM(CASE WHEN payout_status = 'pending' THEN royalty_amount ELSE 0 END) as pending_royalty
          FROM salesperson_monthly_stats
          GROUP BY salesperson_id
        ) stats ON s.id = stats.salesperson_id
        WHERE s.status != 'deleted'
        ORDER BY s.created_at DESC
      `);

      return res.json({
        success: true,
        salespersons: result.rows.map(row => ({
          ...row,
          royalty_rate: parseFloat(row.royalty_rate),
          partner_count: parseInt(row.partner_count),
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          total_royalty: parseFloat(row.total_royalty),
          pending_royalty: parseFloat(row.pending_royalty)
        }))
      });

    } else if (req.method === 'POST') {
      // Create new salesperson
      const { code, name, email, password, phone, royalty_rate } = req.body;

      if (!code || !name || !email || !password) {
        return res.status(400).json({
          error: { message: 'code, name, email, and password are required' }
        });
      }

      // Check for existing code or email
      const existing = await dbPool.query(
        'SELECT id FROM salespersons WHERE code = $1 OR email = $2',
        [code, email]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({
          error: { message: 'Salesperson with this code or email already exists' }
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert salesperson
      const result = await dbPool.query(`
        INSERT INTO salespersons (code, name, email, password_hash, phone, royalty_rate)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, code, name, email, phone, royalty_rate, status, created_at
      `, [
        code,
        name,
        email,
        passwordHash,
        phone || null,
        royalty_rate || 0.10
      ]);

      return res.status(201).json({
        success: true,
        salesperson: {
          ...result.rows[0],
          royalty_rate: parseFloat(result.rows[0].royalty_rate)
        }
      });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Salespersons API Error:', error);
    return res.status(500).json({
      error: { message: error.message || 'Internal server error' }
    });
  }
};
