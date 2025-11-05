"use strict";
/**
 * Session Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const database_1 = require("../config/database");
const FlowService_1 = require("./FlowService");
class SessionService {
    constructor() {
        this.pool = database_1.DatabaseConfig.getPool();
        this.flowService = new FlowService_1.FlowService();
    }
    /**
     * Create a new session
     */
    async createSession(sessionId, ipAddress, userAgent, userName) {
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
    async getSession(sessionId) {
        const query = 'SELECT * FROM sessions WHERE session_id = $1';
        const result = await this.pool.query(query, [sessionId]);
        return result.rows[0] || null;
    }
    /**
     * Get answers count for a session
     */
    async getAnswersCount(sessionId) {
        const query = 'SELECT COUNT(*) FROM answers WHERE session_id = $1';
        const result = await this.pool.query(query, [sessionId]);
        return parseInt(result.rows[0].count);
    }
    /**
     * Get all answers for a session
     */
    async getAnswers(sessionId) {
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
    async getNextQuestion(sessionId, lang) {
        const answers = await this.getAnswers(sessionId);
        return this.flowService.getNextQuestion(answers, lang);
    }
    /**
     * Mark session as completed
     */
    async completeSession(sessionId, kanjiName) {
        const query = `
      UPDATE sessions
      SET completed = true, result_kanji_name = $2, updated_at = NOW()
      WHERE session_id = $1
    `;
        await this.pool.query(query, [sessionId, kanjiName]);
    }
}
exports.SessionService = SessionService;
