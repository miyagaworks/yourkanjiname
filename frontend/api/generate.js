/**
 * Vercel Serverless Function: Kanji Name Generation
 * Handles: POST /api/generate, GET /api/generate (for getting result)
 */

let GenerationService;
let generationService;
let initError = null;

try {
  GenerationService = require('../dist/services/GenerationService').GenerationService;
  generationService = new GenerationService();
} catch (err) {
  initError = err;
  console.error('Failed to initialize GenerationService:', err);
}

module.exports = async function handler(req, res) {
  // Check for initialization error
  if (initError) {
    console.error('Init error details:', initError.message, initError.stack);
    return res.status(500).json({
      error: {
        code: 'INIT_ERROR',
        message: 'Service initialization failed: ' + initError.message
      }
    });
  }
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

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'GEMINI_API_KEY environment variable is not set'
        }
      });
    }

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
      const result = await generationService.generateKanjiName(session_id);
      return res.json(result);
    }

    // GET /api/generate?session_id=xxx&action=result - Get existing result
    if (req.method === 'GET' && action === 'result') {
      const result = await generationService.getResult(session_id);

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
    console.error('Generate error:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);

    if ((error).code === 'INSUFFICIENT_ANSWERS') {
      return res.status(422).json({
        error: {
          code: 'INSUFFICIENT_ANSWERS',
          message: 'Not all questions have been answered yet'
        }
      });
    }

    if ((error).code === 'SESSION_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        }
      });
    }

    return res.status(500).json({
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    });
  }
}
