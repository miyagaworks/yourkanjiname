/**
 * Session Service
 */

import { Pool } from 'pg';
import { DatabaseConfig } from '../config/database';
import { FlowService } from './FlowService';

export interface Session {
  session_id: string;
  created_at: Date;
  updated_at: Date;
  completed: boolean;
  result_kanji_name: string | null;
}

export class SessionService {
  private pool: Pool;
  private flowService: FlowService;

  constructor() {
    this.pool = DatabaseConfig.getPool();
    this.flowService = new FlowService();
  }

  /**
   * Create a new session
   */
  async createSession(sessionId: string, ipAddress?: string, userAgent?: string, userName?: string): Promise<Session> {
    const query = `
      INSERT INTO sessions (session_id, ip_address, user_agent, user_name)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.pool.query(query, [sessionId, ipAddress, userAgent, userName]);
    return result.rows[0];
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const query = 'SELECT * FROM sessions WHERE session_id = $1';
    const result = await this.pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  /**
   * Get answers count for a session
   */
  async getAnswersCount(sessionId: string): Promise<number> {
    const query = 'SELECT COUNT(*) FROM answers WHERE session_id = $1';
    const result = await this.pool.query(query, [sessionId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get all answers for a session
   */
  async getAnswers(sessionId: string): Promise<Array<{ question_id: string; answer_option: string }>> {
    const query = `
      SELECT question_id, answer_option
      FROM answers
      WHERE session_id = $1
      ORDER BY answered_at ASC
    `;
    const result = await this.pool.query(query, [sessionId]);
    return result.rows;
  }

  /**
   * Get next question for session
   */
  async getNextQuestion(sessionId: string, lang: string) {
    const answers = await this.getAnswers(sessionId);
    return this.flowService.getNextQuestion(answers, lang);
  }

  /**
   * Mark session as completed
   */
  async completeSession(sessionId: string, kanjiName: string): Promise<void> {
    const query = `
      UPDATE sessions
      SET completed = true, result_kanji_name = $2, updated_at = NOW()
      WHERE session_id = $1
    `;
    await this.pool.query(query, [sessionId, kanjiName]);
  }
}