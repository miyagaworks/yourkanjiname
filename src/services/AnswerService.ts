/**
 * Answer Service
 */

import { Pool } from 'pg';
import { DatabaseConfig } from '../config/database';
import { FlowService } from './FlowService';

export class AnswerService {
  private pool: Pool;
  private flowService: FlowService;

  constructor() {
    this.pool = DatabaseConfig.getPool();
    this.flowService = new FlowService();
  }

  /**
   * Submit an answer
   */
  async submitAnswer(sessionId: string, questionId: string, answerOption: string) {
    // Check if session exists
    const sessionQuery = 'SELECT * FROM sessions WHERE session_id = $1';
    const sessionResult = await this.pool.query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      const error: any = new Error('Session not found');
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    // Check if already answered
    const checkQuery = 'SELECT * FROM answers WHERE session_id = $1 AND question_id = $2';
    const checkResult = await this.pool.query(checkQuery, [sessionId, questionId]);

    if (checkResult.rows.length > 0) {
      const error: any = new Error('Question already answered');
      error.code = 'ALREADY_ANSWERED';
      throw error;
    }

    // Insert answer
    const insertQuery = `
      INSERT INTO answers (session_id, question_id, answer_option)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    await this.pool.query(insertQuery, [sessionId, questionId, answerOption]);

    // Update session timestamp
    const updateQuery = 'UPDATE sessions SET updated_at = NOW() WHERE session_id = $1';
    await this.pool.query(updateQuery, [sessionId]);

    // Get all answers to determine next question
    const answersQuery = `
      SELECT question_id, answer_option
      FROM answers
      WHERE session_id = $1
      ORDER BY answered_at ASC
    `;
    const answersResult = await this.pool.query(answersQuery, [sessionId]);
    const answers = answersResult.rows;

    // Determine next question
    const nextQuestion = this.flowService.getNextQuestion(answers, 'ja');

    if ((nextQuestion as any).completed) {
      return {
        success: true,
        next_question_id: 'GENERATE_RESULT',
        message: 'All questions completed'
      };
    }

    return {
      success: true,
      next_question_id: (nextQuestion as any).question.id,
      message: 'Answer recorded successfully'
    };
  }
}