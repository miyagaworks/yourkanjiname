/**
 * Salesperson Login API
 * POST /api/salesperson/login
 * Vercel Serverless Function
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
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
 * Generate salesperson token
 * Format: sp_{salespersonId}.{tokenValue}.{hmacHashPrefix}
 */
function generateSalespersonToken(salespersonId) {
  const tokenValue = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHmac('sha256', tokenValue)
    .update(salespersonId.toString())
    .digest('hex');

  return `sp_${salespersonId}.${tokenValue}.${tokenHash.substring(0, 16)}`;
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'INVALID_REQUEST', message: 'Email and password are required' }
      });
    }

    const dbPool = getPool();

    // Find salesperson by email
    const result = await dbPool.query(
      'SELECT id, code, name, password_hash, status FROM salespersons WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const salesperson = result.rows[0];

    // Check if salesperson is active
    if (salesperson.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Account is not active' }
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, salesperson.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Generate session token
    const token = generateSalespersonToken(salesperson.id);

    return res.json({
      success: true,
      token: token,
      salesperson: {
        id: salesperson.id,
        code: salesperson.code,
        name: salesperson.name
      }
    });

  } catch (error) {
    console.error('Salesperson login error:', error.message);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  }
};
