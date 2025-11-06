"use strict";
/**
 * YourKanjiName - Backend API Server
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
// Routes
const sessions_1 = __importDefault(require("./routes/sessions"));
const questions_1 = __importDefault(require("./routes/questions"));
const answers_1 = __importDefault(require("./routes/answers"));
const generation_1 = __importDefault(require("./routes/generation"));
// Load environment variables
dotenv_1.default.config();
// Debug: Log all environment variables
console.log('🔍 All environment variables:');
console.log(JSON.stringify(process.env, null, 2));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ===================================
// Middleware
// ===================================
// Trust proxy (required for Railway and other reverse proxies)
app.set('trust proxy', 1);
// Security
app.use((0, helmet_1.default)());
// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [process.env.FRONTEND_URL || 'http://localhost:3001'];
console.log('🔧 Environment variables check:');
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('Resolved allowedOrigins:', allowedOrigins);
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true
}));
// Body parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Compression
app.use((0, compression_1.default)());
// Logging
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// Rate limiting (disabled for development)
if (process.env.NODE_ENV === 'production') {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 500,
        message: JSON.stringify({ error: 'Too many requests from this IP, please try again later.' })
    });
    app.use('/api/', limiter);
}
// ===================================
// Routes
// ===================================
app.use('/api/sessions', sessions_1.default);
app.use('/api/sessions', answers_1.default);
app.use('/api/sessions', generation_1.default);
app.use('/api/questions', questions_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'YourKanjiName API',
        version: '2.0.0',
        endpoints: {
            sessions: '/api/sessions',
            questions: '/api/questions',
            answers: '/api/answers',
            generation: '/api/generation',
            health: '/health'
        }
    });
});
// ===================================
// Error Handling
// ===================================
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
            path: req.path
        }
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    res.status(statusCode).json({
        error: {
            code,
            message: err.message || 'An unexpected error occurred',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});
// ===================================
// Server Start
// ===================================
app.listen(PORT, () => {
    console.log(`🚀 YourKanjiName API server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
});
exports.default = app;
