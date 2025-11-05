"use strict";
/**
 * Question Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionService = void 0;
const FlowService_1 = require("./FlowService");
class QuestionService {
    constructor() {
        this.flowService = new FlowService_1.FlowService();
    }
    /**
     * Get a specific question
     */
    async getQuestion(questionId, lang = 'ja') {
        return this.flowService.getQuestion(questionId, lang);
    }
}
exports.QuestionService = QuestionService;
