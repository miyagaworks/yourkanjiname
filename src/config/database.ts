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
      // Use DATABASE_URL if available (production), otherwise use individual env vars (development)
      if (process.env.DATABASE_URL) {
        // Remove sslmode from DATABASE_URL to prevent SSL warning
        let connectionString = process.env.DATABASE_URL;
        try {
          const url = new URL(connectionString);
          url.searchParams.delete('sslmode');
          connectionString = url.toString();
        } catch (e) {
          // If URL parsing fails, use regex fallback
          connectionString = connectionString
            .replace(/\?sslmode=[^&]*&?/, '?')
            .replace(/&sslmode=[^&]*/, '')
            .replace(/\?$/, '');
        }

        this.pool = new Pool({
          connectionString,
          ssl: {
            rejectUnauthorized: false
          },
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });
      } else {
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
      }

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