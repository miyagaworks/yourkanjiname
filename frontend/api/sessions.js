/**
 * Vercel Serverless Function: Session Management
 * Handles: POST /api/sessions, GET /api/sessions/[id], GET /api/sessions/[id]/next-question
 */

const { v4: uuidv4 } = require('uuid');
const { SessionService } = require('../src/services/SessionService');

const sessionService = new SessionService();

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Check for required environment variables
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'DATABASE_URL environment variable is not set'
        }
      });
    }

    const { action, session_id } = req.query;

    // POST /api/sessions - Create new session
    if (req.method === 'POST' && !session_id) {
      const sessionId = uuidv4();
      const ipAddress = req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown';
      const userAgent = req.headers['user-agent'];
      const userName = req.body?.user_name;

      const session = await sessionService.createSession(sessionId, ipAddress, userAgent, userName);

      return res.status(201).json({
        session_id: session.session_id,
        created_at: session.created_at,
        current_question_id: 'Q0'
      });
    }

    // GET /api/sessions?session_id=xxx&action=next-question
    if (req.method === 'GET' && session_id && action === 'next-question') {
      const lang = (req.query.lang as string) || 'ja';

      const session = await sessionService.getSession(session_id as string);

      if (!session) {
        return res.status(404).json({
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'The specified session does not exist'
          }
        });
      }

      if (session.completed) {
        return res.status(409).json({
          error: {
            code: 'SESSION_COMPLETED',
            message: 'This session has already been completed'
          }
        });
      }

      const nextQuestion = await sessionService.getNextQuestion(session_id as string, lang);

      return res.json(nextQuestion);
    }

    // GET /api/sessions?session_id=xxx - Get session info
    if (req.method === 'GET' && session_id && !action) {
      const session = await sessionService.getSession(session_id as string);

      if (!session) {
        return res.status(404).json({
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'The specified session does not exist'
          }
        });
      }

      const answersCount = await sessionService.getAnswersCount(session_id as string);

      return res.json({
        session_id: session.session_id,
        created_at: session.created_at,
        updated_at: session.updated_at,
        completed: session.completed,
        answers_count: answersCount
      });
    }

    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });

  } catch (error) {
    console.error('Error in sessions API:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    });
  }
}
