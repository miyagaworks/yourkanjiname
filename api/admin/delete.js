/**
 * Admin Delete Request API
 * DELETE /api/admin/delete
 * Deletes a calligraphy request
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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  if (!verifyToken(req)) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }

  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        error: { message: 'requestId is required' }
      });
    }

    const dbPool = getPool();

    const result = await dbPool.query(
      'DELETE FROM calligraphy_requests WHERE id = $1 RETURNING id',
      [requestId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: { message: 'Request not found' }
      });
    }

    return res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({
      error: { message: 'Failed to delete request' }
    });
  }
};
