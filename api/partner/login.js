/**
 * Partner Login API
 * POST /api/partner/login
 * Vercel Serverless Function
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { getPool } = require('../lib/db');
const { setCorsHeaders, handlePreflight } = require('../lib/security');

/**
 * Generate partner token
 * Format: {partnerId}.{tokenValue}.{hmacHashPrefix}
 */
function generatePartnerToken(partnerId) {
  const tokenValue = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHmac('sha256', tokenValue)
    .update(partnerId.toString())
    .digest('hex');

  return `${partnerId}.${tokenValue}.${tokenHash.substring(0, 16)}`;
}

module.exports = async function handler(req, res) {
  // CORS headers with origin whitelist
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

    // Generate session token using HMAC
    const token = generatePartnerToken(partner.id);

    return res.json({
      success: true,
      token: token,
      partner: {
        id: partner.id,
        code: partner.code,
        name: partner.name
      }
    });

  } catch (error) {
    console.error('Partner login error:', error.message);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
    });
  }
};
