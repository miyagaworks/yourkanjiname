/**
 * Admin Demo Codes API
 * GET/POST/DELETE /api/admin/demo-codes
 * Vercel Serverless Function
 *
 * Manage demo codes for partner presentations
 */

const { Pool } = require('pg');
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
      let { description, max_uses = 1, expires_hours = 24 } = req.body;

      // Validate and sanitize inputs
      max_uses = Math.min(Math.max(parseInt(max_uses) || 1, 1), 100); // 1-100
      expires_hours = Math.min(Math.max(parseInt(expires_hours) || 24, 1), 720); // 1-720 hours (30 days max)
      description = description ? String(description).substring(0, 255) : null;

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

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: { message: 'Valid ID is required' } });
      }

      await dbPool.query(`
        UPDATE demo_codes SET is_active = false WHERE id = $1
      `, [parseInt(id)]);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: { message: 'Method not allowed' } });

  } catch (error) {
    console.error('Demo codes API error:', error);
    return res.status(500).json({ error: { message: error.message } });
  }
};
