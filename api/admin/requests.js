/**
 * Admin Requests API
 * GET /api/admin/requests
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

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (handlePreflight(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  if (!verifyAdminToken(req.headers.authorization)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  try {
    const dbPool = getPool();

    const result = await dbPool.query(`
      SELECT id, email, kanji_name, user_name, language,
             explanation_ja, status, created_at, sent_at
      FROM calligraphy_requests
      ORDER BY
        CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 100
    `);

    return res.json({
      success: true,
      requests: result.rows
    });
  } catch (error) {
    console.error('Requests fetch error:', error);
    return res.status(500).json({
      error: { message: 'Failed to fetch requests' }
    });
  }
};
