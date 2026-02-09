/**
 * Shared Database Connection Pool
 * Centralized PostgreSQL connection management
 */

const { Pool } = require('pg');

let pool;

/**
 * Get or create database connection pool
 * Uses singleton pattern to reuse connections across requests
 */
function getPool() {
  if (!pool) {
    // Remove sslmode from DATABASE_URL and set SSL via options
    let connectionString = process.env.DATABASE_URL || '';
    connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }
  return pool;
}

/**
 * Execute a query with automatic connection handling
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<QueryResult>}
 */
async function query(text, params) {
  const dbPool = getPool();
  return dbPool.query(text, params);
}

/**
 * Get a client from the pool for transactions
 * Remember to release the client after use
 * @returns {Promise<PoolClient>}
 */
async function getClient() {
  const dbPool = getPool();
  return dbPool.connect();
}

module.exports = {
  getPool,
  query,
  getClient
};
