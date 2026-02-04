/**
 * Admin Partners API
 * GET/POST /api/admin/partners
 * Vercel Serverless Function
 *
 * Manage partners (list and create)
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
  // CORS headers with origin whitelist
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  // Verify authentication
  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  const dbPool = getPool();

  try {
    if (req.method === 'GET') {
      // List all partners with stats
      const result = await dbPool.query(`
        SELECT
          p.id, p.code, p.name, p.email, p.contact_name, p.phone, p.address,
          p.bank_name, p.bank_branch, p.bank_account, p.royalty_rate, p.price_usd, p.status,
          p.created_at, p.updated_at,
          COALESCE(pay_stats.total_payments, 0) as total_payments,
          COALESCE(pay_stats.total_revenue, 0) as total_revenue,
          COALESCE(pay_stats.total_royalty, 0) as total_royalty,
          COALESCE(monthly_stats.unpaid_royalty, 0) as pending_royalty
        FROM partners p
        LEFT JOIN (
          SELECT
            partner_id,
            COUNT(*) as total_payments,
            SUM(amount) as total_revenue,
            SUM(amount * (SELECT royalty_rate FROM partners WHERE id = payments.partner_id)) as total_royalty
          FROM payments
          WHERE status = 'succeeded' AND partner_id IS NOT NULL
          GROUP BY partner_id
        ) pay_stats ON p.id = pay_stats.partner_id
        LEFT JOIN (
          SELECT
            partner_id,
            SUM(royalty_amount) as unpaid_royalty
          FROM partner_monthly_stats
          WHERE payout_status = 'pending'
          GROUP BY partner_id
        ) monthly_stats ON p.id = monthly_stats.partner_id
        WHERE p.status != 'deleted'
        ORDER BY p.created_at DESC
      `);

      return res.json({
        success: true,
        partners: result.rows.map(row => ({
          ...row,
          royalty_rate: parseFloat(row.royalty_rate),
          price_usd: (parseFloat(row.price_usd) || 5.00).toFixed(2),
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          total_royalty: parseFloat(row.total_royalty),
          pending_royalty: parseFloat(row.pending_royalty)
        }))
      });

    } else if (req.method === 'POST') {
      // Create new partner
      const {
        code,
        name,
        email,
        password,
        contact_name,
        phone,
        address,
        bank_name,
        bank_branch,
        bank_account,
        royalty_rate,
        price_usd
      } = req.body;

      // Validate required fields
      if (!code || !name || !email || !password) {
        return res.status(400).json({
          error: { code: 'INVALID_REQUEST', message: 'code, name, email, and password are required' }
        });
      }

      // Validate code format (alphanumeric and hyphens only)
      if (!/^[a-z0-9-]+$/.test(code)) {
        return res.status(400).json({
          error: { code: 'INVALID_CODE', message: 'Code must contain only lowercase letters, numbers, and hyphens' }
        });
      }

      // Check for duplicate code or email
      const existingResult = await dbPool.query(
        'SELECT code, email FROM partners WHERE code = $1 OR email = $2',
        [code, email.toLowerCase()]
      );

      if (existingResult.rows.length > 0) {
        const existing = existingResult.rows[0];
        if (existing.code === code) {
          return res.status(409).json({
            error: { code: 'DUPLICATE_CODE', message: 'Partner code already exists' }
          });
        }
        if (existing.email === email.toLowerCase()) {
          return res.status(409).json({
            error: { code: 'DUPLICATE_EMAIL', message: 'Email already registered' }
          });
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert partner
      const result = await dbPool.query(`
        INSERT INTO partners (
          code, name, email, password_hash, contact_name, phone, address,
          bank_name, bank_branch, bank_account, royalty_rate, price_usd, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
        RETURNING id, code, name, email, contact_name, phone, address,
                  bank_name, bank_branch, bank_account, royalty_rate, price_usd, status, created_at
      `, [
        code,
        name,
        email.toLowerCase(),
        passwordHash,
        contact_name || null,
        phone || null,
        address || null,
        bank_name || null,
        bank_branch || null,
        bank_account || null,
        royalty_rate || 0.10,
        price_usd || 5.00
      ]);

      return res.status(201).json({
        success: true,
        partner: {
          ...result.rows[0],
          royalty_rate: parseFloat(result.rows[0].royalty_rate),
          price_usd: (parseFloat(result.rows[0].price_usd) || 5.00).toFixed(2)
        }
      });

    } else {
      return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error) {
    console.error('Admin partners error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Internal server error' }
    });
  }
};
