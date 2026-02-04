/**
 * Vercel Serverless Function: Kanji Name Generation
 * Handles: POST /api/generate, GET /api/generate (for getting result)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GenerationService } from '../src/services/GenerationService';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { setCorsHeaders, handlePreflight } = require('./lib/security');

const generationService = new GenerationService();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers with origin whitelist
  setCorsHeaders(req, res);

  // Handle preflight
  if (handlePreflight(req, res)) return;

  try {
    const { session_id, action } = req.query;

    if (!session_id) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'session_id is required'
        }
      });
    }

    // POST /api/generate - Generate kanji name
    if (req.method === 'POST') {
      const result = await generationService.generateKanjiName(session_id as string);
      return res.json(result);
    }

    // GET /api/generate?session_id=xxx&action=result - Get existing result
    if (req.method === 'GET' && action === 'result') {
      const result = await generationService.getResult(session_id as string);

      if (!result) {
        return res.status(404).json({
          error: {
            code: 'RESULT_NOT_FOUND',
            message: 'No result found for this session'
          }
        });
      }

      return res.json(result);
    }

    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed'
      }
    });

  } catch (error) {
    if ((error as any).code === 'INSUFFICIENT_ANSWERS') {
      return res.status(422).json({
        error: {
          code: 'INSUFFICIENT_ANSWERS',
          message: 'Not all questions have been answered yet'
        }
      });
    }

    console.error('Error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    });
  }
}
