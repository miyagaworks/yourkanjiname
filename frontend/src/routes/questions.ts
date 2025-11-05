/**
 * Question Routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { QuestionService } from '../services/QuestionService';

const router = express.Router();
const questionService = new QuestionService();

/**
 * GET /api/questions/:question_id
 * Get a specific question
 */
router.get('/:question_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question_id } = req.params;
    const lang = (req.query.lang as string) || 'ja';

    const question = await questionService.getQuestion(question_id, lang);

    if (!question) {
      return res.status(404).json({
        error: {
          code: 'QUESTION_NOT_FOUND',
          message: 'The specified question does not exist'
        }
      });
    }

    res.json(question);
  } catch (error) {
    next(error);
  }
});

export default router;