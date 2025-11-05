/**
 * Session Routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SessionService } from '../services/SessionService';

const router = express.Router();
const sessionService = new SessionService();

/**
 * POST /api/sessions
 * Create a new session
 * Body: { user_name?: string }
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = uuidv4();
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');
    const userName = req.body.user_name;

    const session = await sessionService.createSession(sessionId, ipAddress, userAgent, userName);

    res.status(201).json({
      session_id: session.session_id,
      created_at: session.created_at,
      current_question_id: 'Q0'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/:session_id
 * Get session information
 */
router.get('/:session_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id } = req.params;
    const session = await sessionService.getSession(session_id);

    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'The specified session does not exist'
        }
      });
    }

    const answersCount = await sessionService.getAnswersCount(session_id);

    res.json({
      session_id: session.session_id,
      created_at: session.created_at,
      updated_at: session.updated_at,
      completed: session.completed,
      answers_count: answersCount
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/:session_id/next-question
 * Get the next question for the session
 */
router.get('/:session_id/next-question', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id } = req.params;
    const lang = (req.query.lang as string) || 'ja';

    const session = await sessionService.getSession(session_id);

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

    const nextQuestion = await sessionService.getNextQuestion(session_id, lang);

    res.json(nextQuestion);
  } catch (error) {
    next(error);
  }
});

export default router;