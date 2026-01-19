/**
 * Admin Partners API
 * GET/POST /api/admin/partners
 * Vercel Serverless Function
 *
 * Manage partners (list and create)
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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
      // List all partners with stats
      const result = await dbPool.query(`
        SELECT
          p.id, p.code, p.name, p.email, p.contact_name, p.phone,
          p.bank_name, p.bank_account, p.royalty_rate, p.status,
          p.created_at, p.updated_at,
          COALESCE(COUNT(pay.id), 0) as total_payments,
          COALESCE(SUM(CASE WHEN pay.status = 'succeeded' THEN pay.amount ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN pay.status = 'succeeded' THEN pay.amount * p.royalty_rate ELSE 0 END), 0) as total_royalty
        FROM partners p
        LEFT JOIN payments pay ON p.id = pay.partner_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `);

      return res.json({
        success: true,
        partners: result.rows.map(row => ({
          ...row,
          royalty_rate: parseFloat(row.royalty_rate),
          total_payments: parseInt(row.total_payments),
          total_revenue: parseFloat(row.total_revenue),
          total_royalty: parseFloat(row.total_royalty)
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
        bank_account,
        royalty_rate
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
          bank_name, bank_account, royalty_rate, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
        RETURNING id, code, name, email, contact_name, phone, address,
                  bank_name, bank_account, royalty_rate, status, created_at
      `, [
        code,
        name,
        email.toLowerCase(),
        passwordHash,
        contact_name || null,
        phone || null,
        address || null,
        bank_name || null,
        bank_account || null,
        royalty_rate || 0.10
      ]);

      return res.status(201).json({
        success: true,
        partner: {
          ...result.rows[0],
          royalty_rate: parseFloat(result.rows[0].royalty_rate)
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
