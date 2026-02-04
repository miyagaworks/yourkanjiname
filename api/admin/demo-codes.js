/**
 * Admin Demo Codes API
 * GET/POST/DELETE /api/admin/demo-codes
 * Vercel Serverless Function
 *
 * Manage demo codes for partner presentations
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

// Generate a random demo code like "DEMO-A3X9-K2M7"
function generateDemoCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = 'DEMO-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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
      // List all demo codes with usage stats
      const result = await dbPool.query(`
        SELECT
          dc.id, dc.code, dc.description, dc.max_uses, dc.used_count,
          dc.expires_at, dc.created_at, dc.is_active,
          CASE
            WHEN dc.is_active = false THEN 'inactive'
            WHEN dc.expires_at < NOW() THEN 'expired'
            WHEN dc.used_count >= dc.max_uses THEN 'used_up'
            ELSE 'active'
          END as status
        FROM demo_codes dc
        ORDER BY dc.created_at DESC
      `);

      return res.status(200).json({
        success: true,
        demo_codes: result.rows
      });
    }

    if (req.method === 'POST') {
      // Create new demo code
      const { description, max_uses = 1, expires_hours = 24 } = req.body;

      const code = generateDemoCode();
      const expiresAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000);

      const result = await dbPool.query(`
        INSERT INTO demo_codes (code, description, max_uses, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, code, description, max_uses, used_count, expires_at, created_at, is_active
      `, [code, description || null, max_uses, expiresAt]);

      return res.status(201).json({
        success: true,
        demo_code: result.rows[0]
      });
    }

    if (req.method === 'DELETE') {
      // Deactivate demo code
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: { message: 'ID is required' } });
      }

      await dbPool.query(`
        UPDATE demo_codes SET is_active = false WHERE id = $1
      `, [id]);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: { message: 'Method not allowed' } });

  } catch (error) {
    console.error('Demo codes API error:', error);
    return res.status(500).json({ error: { message: error.message } });
  }
};
