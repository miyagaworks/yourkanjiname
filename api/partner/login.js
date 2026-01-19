/**
 * Partner Login API
 * POST /api/partner/login
 * Vercel Serverless Function
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

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
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // Find partner by email
    const result = await dbPool.query(
      'SELECT id, code, name, password_hash, status FROM partners WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const partner = result.rows[0];

    // Check if partner is active
    if (partner.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Account is not active' }
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, partner.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256')
      .update(token + partner.id.toString())
      .digest('hex');

    return res.json({
      success: true,
      token: `${partner.id}.${token}.${tokenHash.substring(0, 16)}`,
      partner: {
        id: partner.id,
        code: partner.code,
        name: partner.name
      }
    });

  } catch (error) {
    console.error('Partner login error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  }
};
