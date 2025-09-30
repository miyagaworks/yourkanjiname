/**
 * Database Configuration
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseConfig {
  private static pool: Pool;

  static getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'yourkanjiname',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.pool.on('error', (err) => {
        console.error('Unexpected database error:', err);
      });
    }

    return this.pool;
  }

  static async closePool(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}