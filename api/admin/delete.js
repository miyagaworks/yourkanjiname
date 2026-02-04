/**
 * Admin Delete Request API
 * DELETE /api/admin/delete
 * Deletes a calligraphy request
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

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // Verify authentication
  if (!verifyAdminToken(req.headers.authorization)) {
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
