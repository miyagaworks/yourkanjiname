/**
 * Admin Requests API
 * GET /api/admin/requests
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

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  if (!verifyToken(req)) {
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
