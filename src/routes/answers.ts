/**
 * Answer Routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { AnswerService } from '../services/AnswerService';

const router = express.Router();
const answerService = new AnswerService();

/**
 * POST /api/sessions/:session_id/answers
 * Submit an answer
 */
router.post('/:session_id/answers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id } = req.params;
    const { question_id, answer_option } = req.body;

    // Validation
    if (!question_id || !answer_option) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'question_id and answer_option are required'
        }
      });
    }

    const result = await answerService.submitAnswer(session_id, question_id, answer_option);

    res.status(201).json(result);
  } catch (error) {
    if ((error as any).code === 'ALREADY_ANSWERED') {
      return res.status(409).json({
        error: {
          code: 'ALREADY_ANSWERED',
          message: 'This question has already been answered'
        }
      });
    }
    next(error);
  }
});

export default router;