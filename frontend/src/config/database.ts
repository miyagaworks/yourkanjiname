/**
 * Database Configuration
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Cache pool at module level for serverless warm instances
let cachedPool: Pool | null = null;

export class DatabaseConfig {
  static getPool(): Pool {
    // Return cached pool if available
    if (cachedPool) {
      return cachedPool;
    }

    // Use DATABASE_URL if available (production), otherwise use individual env vars (development)
    if (process.env.DATABASE_URL) {
      cachedPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        },
        max: 1, // Serverless: only 1 connection per instance
        idleTimeoutMillis: 0, // Close idle connections immediately
        connectionTimeoutMillis: 10000,
      });

      cachedPool.on('error', (err) => {
        console.error('Unexpected database error:', err);
        cachedPool = null; // Reset cache on error
      });

      return cachedPool;
    } else {
      cachedPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'yourkanjiname',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      cachedPool.on('error', (err) => {
        console.error('Unexpected database error:', err);
        cachedPool = null;
      });

      return cachedPool;
    }
  }

  static async closePool(pool: Pool): Promise<void> {
    if (pool) {
      await pool.end();
      if (pool === cachedPool) {
        cachedPool = null;
      }
    }
  }
}