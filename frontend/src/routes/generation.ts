/**
 * Generation Routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { GenerationService } from '../services/GenerationService';

const router = express.Router();
const generationService = new GenerationService();

/**
 * POST /api/sessions/:session_id/generate
 * Generate kanji name
 */
router.post('/:session_id/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id } = req.params;

    const result = await generationService.generateKanjiName(session_id);

    res.json(result);
  } catch (error) {
    if ((error as any).code === 'INSUFFICIENT_ANSWERS') {
      return res.status(422).json({
        error: {
          code: 'INSUFFICIENT_ANSWERS',
          message: 'Not all questions have been answered yet'
        }
      });
    }
    next(error);
  }
});

/**
 * GET /api/sessions/:session_id/result
 * Get existing result
 */
router.get('/:session_id/result', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { session_id } = req.params;

    const result = await generationService.getResult(session_id);

    if (!result) {
      return res.status(404).json({
        error: {
          code: 'RESULT_NOT_FOUND',
          message: 'No result found for this session'
        }
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;