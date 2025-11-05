"use strict";
/**
 * Answer Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerService = void 0;
const database_1 = require("../config/database");
const FlowService_1 = require("./FlowService");
class AnswerService {
    constructor() {
        this.pool = database_1.DatabaseConfig.getPool();
        this.flowService = new FlowService_1.FlowService();
    }
    /**
     * Submit an answer
     */
    async submitAnswer(sessionId, questionId, answerOption) {
        // Check if session exists
        const sessionQuery = 'SELECT * FROM sessions WHERE session_id = $1';
        const sessionResult = await this.pool.query(sessionQuery, [sessionId]);
        if (sessionResult.rows.length === 0) {
            const error = new Error('Session not found');
            error.code = 'SESSION_NOT_FOUND';
            throw error;
        }
        // Check if already answered
        const checkQuery = 'SELECT * FROM answers WHERE session_id = $1 AND question_id = $2';
        const checkResult = await this.pool.query(checkQuery, [sessionId, questionId]);
        if (checkResult.rows.length > 0) {
            const error = new Error('Question already answered');
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
        // Return success response
        return {
            success: true,
            message: 'Answer recorded successfully'
        };
    }
    /**
     * Submit answer and get next question
     */
    async submitAnswerAndGetNext(sessionId, questionId, answerOption, lang = 'ja') {
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
exports.AnswerService = AnswerService;
