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

    // Insert answer, or update it if this question was already answered
    // (回答の修正を許可する。answered_at は更新しない — 生成処理が回答を
    // answered_at 昇順で並べて使用しているため、更新すると回答順序が変わる)
    const insertQuery = `
      INSERT INTO answers (session_id, question_id, answer_option)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_id, question_id)
      DO UPDATE SET answer_option = EXCLUDED.answer_option
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

    // Return success response
    return {
      success: true,
      message: 'Answer recorded successfully'
    };
  }

  /**
   * Submit answer and get next question
   */
  async submitAnswerAndGetNext(sessionId: string, questionId: string, answerOption: string, lang: string = 'ja') {
    // Submit the answer first
    await this.submitAnswer(sessionId, questionId, answerOption);

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
    const nextQuestion = this.flowService.getNextQuestion(answers, lang);

    return nextQuestion;
  }
}