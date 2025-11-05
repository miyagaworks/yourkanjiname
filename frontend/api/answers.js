/**
 * Vercel Serverless Function: Answer Submission
 * Handles: POST /api/answers
 */

const { AnswerService } = require('../dist/services/AnswerService');

const answerService = new AnswerService();

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

    if (req.method !== 'POST') {
      return res.status(405).json({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed'
        }
      });
    }

    const { session_id, question_id, answer_option } = req.body;
    const lang = req.query.lang || 'ja';

    // Validation
    if (!session_id || !question_id || !answer_option) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'session_id, question_id and answer_option are required'
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
    return res.status(201).json(result);

  } catch (error) {
    if ((error).code === 'ALREADY_ANSWERED') {
      return res.status(409).json({
        error: {
          code: 'ALREADY_ANSWERED',
          message: 'This question has already been answered'
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
