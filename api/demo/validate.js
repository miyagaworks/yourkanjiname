/**
 * Demo Code Validation API
 * POST /api/demo/validate
 * Vercel Serverless Function
 *
 * Validates and consumes a demo code for free service access
 */

const { Pool } = require('pg');

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const dbPool = getPool();

  try {
    const { code, session_id } = req.body;

    if (!code) {
      return res.status(400).json({
        valid: false,
        error: { message: 'コードを入力してください' }
      });
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    // Get client IP for logging
    const ip = req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               'unknown';

    // Check if code exists and is valid
    const result = await dbPool.query(`
      SELECT id, code, description, max_uses, used_count, expires_at, is_active
      FROM demo_codes
      WHERE code = $1
    `, [normalizedCode]);

    if (result.rows.length === 0) {
      return res.status(200).json({
        valid: false,
        error: { message: '無効なコードです' }
      });
    }

    const demoCode = result.rows[0];

    // Check if active
    if (!demoCode.is_active) {
      return res.status(200).json({
        valid: false,
        error: { message: 'このコードは無効化されています' }
      });
    }

    // Check expiration
    if (new Date(demoCode.expires_at) < new Date()) {
      return res.status(200).json({
        valid: false,
        error: { message: 'このコードは有効期限切れです' }
      });
    }

    // Check usage count
    if (demoCode.used_count >= demoCode.max_uses) {
      return res.status(200).json({
        valid: false,
        error: { message: 'このコードは使用上限に達しました' }
      });
    }

    // Code is valid - increment usage and log
    await dbPool.query(`
      UPDATE demo_codes
      SET used_count = used_count + 1
      WHERE id = $1
    `, [demoCode.id]);

    await dbPool.query(`
      INSERT INTO demo_code_usage (demo_code_id, session_id, ip_address)
      VALUES ($1, $2, $3)
    `, [demoCode.id, session_id || null, ip]);

    return res.status(200).json({
      valid: true,
      message: 'デモコードが適用されました。無料でご利用いただけます。',
      demo_code: {
        code: demoCode.code,
        description: demoCode.description
      }
    });

  } catch (error) {
    console.error('Demo code validation error:', error);
    return res.status(500).json({
      valid: false,
      error: { message: 'サーバーエラーが発生しました' }
    });
  }
};
