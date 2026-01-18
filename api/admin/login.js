/**
 * Admin Login API
 * POST /api/admin/login
 * Vercel Serverless Function
 */

const crypto = require('crypto');

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
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD not configured');
      return res.status(500).json({ error: { message: 'Server configuration error' } });
    }

    if (password === adminPassword) {
      // Generate a simple session token
      const token = crypto.randomBytes(32).toString('hex');

      // In production, you'd want to store this in a database or Redis
      // For simplicity, we'll use a hash that can be verified
      const tokenHash = crypto.createHash('sha256')
        .update(token + adminPassword)
        .digest('hex');

      return res.json({
        success: true,
        token: token + '.' + tokenHash.substring(0, 16)
      });
    }

    return res.status(401).json({
      success: false,
      error: { message: 'Invalid password' }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: { message: 'Internal server error' }
    });
  }
};
