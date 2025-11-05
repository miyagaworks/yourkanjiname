"use strict";
/**
 * Database Configuration
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConfig = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class DatabaseConfig {
    static getPool() {
        if (!this.pool) {
            // Use DATABASE_URL if available (production), otherwise use individual env vars (development)
            if (process.env.DATABASE_URL) {
                this.pool = new pg_1.Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl: {
                        rejectUnauthorized: false
                    },
                    max: 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 10000,
                });
            }
            else {
                this.pool = new pg_1.Pool({
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
    static async closePool() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}
exports.DatabaseConfig = DatabaseConfig;
