/**
 * Database Configuration
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseConfig {
  // For serverless, create a new pool each time instead of caching
  static getPool(): Pool {
    // Use DATABASE_URL if available (production), otherwise use individual env vars (development)
    if (process.env.DATABASE_URL) {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        },
        max: 1, // Serverless: use only 1 connection
        idleTimeoutMillis: 1, // Close immediately when idle
        connectionTimeoutMillis: 10000,
      });

      pool.on('error', (err) => {
        console.error('Unexpected database error:', err);
      });

      return pool;
    } else {
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'yourkanjiname',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      pool.on('error', (err) => {
        console.error('Unexpected database error:', err);
      });

      return pool;
    }
  }

  static async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}