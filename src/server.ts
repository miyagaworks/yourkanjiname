/**
 * YourKanjiName - Backend API Server
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Routes
import sessionRoutes from './routes/sessions';
import questionRoutes from './routes/questions';
import answerRoutes from './routes/answers';
import generationRoutes from './routes/generation';

// Load environment variables
dotenv.config();

// Debug: Log all environment variables
console.log('🔍 All environment variables:');
console.log(JSON.stringify(process.env, null, 2));

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ===================================
// Middleware
// ===================================

// Trust proxy (required for Railway and other reverse proxies)
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [process.env.FRONTEND_URL || 'http://localhost:3001'];

console.log('🔧 Environment variables check:');
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('Resolved allowedOrigins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting (disabled for development)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);

  // Session creation rate limit
  const sessionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 sessions per hour per IP
    message: 'Too many sessions created, please try again later.'
  });
  app.use('/api/sessions', sessionLimiter);
}

// ===================================
// Routes
// ===================================

app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions', answerRoutes);
app.use('/api/sessions', generationRoutes);
app.use('/api/questions', questionRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
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
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      path: req.path
    }
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  const statusCode = (err as any).statusCode || 500;
  const code = (err as any).code || 'INTERNAL_ERROR';

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

export default app;