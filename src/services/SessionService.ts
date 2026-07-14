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
  payment_intent_id?: string | null;
  payment_verification?: string | null;
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
   *
   * paymentIntentId / paymentVerification は M-4/M-5（決済とセッションの紐付け・
   * サーバー側決済チェック）で追加。省略可能を維持しているのは src/routes/sessions.ts
   * （非デプロイの旧Express構成、4引数のまま）を壊さないため。
   */
  async createSession(
    sessionId: string,
    ipAddress?: string,
    userAgent?: string,
    userName?: string,
    paymentIntentId?: string | null,
    paymentVerification?: string | null
  ): Promise<Session> {
    const query = `
      INSERT INTO sessions (session_id, ip_address, user_agent, user_name, payment_intent_id, payment_verification)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      sessionId,
      ipAddress,
      userAgent,
      userName,
      paymentIntentId ?? null,
      paymentVerification ?? null
    ]);
    return result.rows[0];
  }

  /**
   * Stripe決済のpaymentsレコードにsession_idを紐付ける（M-4）。
   * 対象行が無くても（webhook未到達・既に紐付け済み等）静かに0件更新で終わる。
   * 失敗時の扱いは呼び出し元（api/sessions.ts）でtry/catchすること。
   */
  async linkStripePayment(sessionId: string, paymentIntentId: string): Promise<void> {
    await this.pool.query(
      `UPDATE payments SET session_id = $1 WHERE stripe_payment_intent_id = $2 AND session_id IS NULL`,
      [sessionId, paymentIntentId]
    );
  }

  /**
   * デモコードの未紐付け使用ログ（demo_code_usage.session_id IS NULL の最新1行）に
   * このsession_idを書き込む（M-4）。対象行が見つかった場合はtrueを返す。
   * falseの場合、呼び出し元はpayment_verificationをdemo_unlinkedへ差し替えること。
   */
  async linkDemoUsage(sessionId: string, demoCode: string): Promise<boolean> {
    const result = await this.pool.query(
      `
      UPDATE demo_code_usage
      SET session_id = $1
      WHERE id = (
        SELECT dcu.id
        FROM demo_code_usage dcu
        JOIN demo_codes dc ON dc.id = dcu.demo_code_id
        WHERE dc.code = $2 AND dcu.session_id IS NULL
        ORDER BY dcu.used_at DESC
        LIMIT 1
      )
      RETURNING id
      `,
      [sessionId, demoCode]
    );
    return result.rows.length > 0;
  }

  /**
   * payment_verification列を後から上書きする。
   * デモコードの未紐付け使用ログが見つからなかった場合に demo_unlinked へ差し替える用途（M-5）。
   */
  async updatePaymentVerification(sessionId: string, verification: string): Promise<void> {
    await this.pool.query(
      `UPDATE sessions SET payment_verification = $2 WHERE session_id = $1`,
      [sessionId, verification]
    );
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