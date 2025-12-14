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
// Cache pool at module level for serverless warm instances
let cachedPool = null;
class DatabaseConfig {
    static getPool() {
        // Return cached pool if available
        if (cachedPool) {
            return cachedPool;
        }
        // Use DATABASE_URL if available (production), otherwise use individual env vars (development)
        if (process.env.DATABASE_URL) {
            cachedPool = new pg_1.Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                },
                max: 3,
                idleTimeoutMillis: 10000,
                connectionTimeoutMillis: 5000,
            });
            cachedPool.on('error', (err) => {
                console.error('Unexpected database error:', err);
                cachedPool = null; // Reset cache on error
            });
            return cachedPool;
        }
        else {
            cachedPool = new pg_1.Pool({
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
    static async closePool(pool) {
        if (pool) {
            await pool.end();
            if (pool === cachedPool) {
                cachedPool = null;
            }
        }
    }
}
exports.DatabaseConfig = DatabaseConfig;
