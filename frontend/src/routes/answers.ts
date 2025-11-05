/**
 * Answer Routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { AnswerService } from '../services/AnswerService';

const router = express.Router();
const answerService = new AnswerService();

/**
 * POST /api/sessions/:session_id/answers
 * Submit an answer and optionally get next question
 * Query params: lang (optional) - if provided, returns next question
 */
router.post('/:session_id/answers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id } = req.params;
    const { question_id, answer_option } = req.body;
    const lang = req.query.lang as string || 'ja';

    // Validation
    if (!question_id || !answer_option) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'question_id and answer_option are required'
        }
      });
    }

    // If lang is provided, return next question
    if (req.query.lang) {
      const result = await answerService.submitAnswerAndGetNext(session_id, question_id, answer_option, lang);
      return res.status(201).json(result);
    }

    // Otherwise just submit answer
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