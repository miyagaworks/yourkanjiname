/**
 * Admin Login API
 * POST /api/admin/login
 * Vercel Serverless Function
 */

const { setCorsHeaders, handlePreflight, generateAdminToken } = require('../_utils/security');

module.exports = async function handler(req, res) {
  // CORS headers with origin whitelist
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not configured');
      return res.status(500).json({ error: { message: 'Server configuration error' } });
    }

    if (password === adminPassword) {
      // Generate secure HMAC-based token
      const token = generateAdminToken();

      return res.json({
        success: true,
        token: token
      });
    }

    return res.status(401).json({
      success: false,
      error: { message: 'Invalid password' }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
};
