"use strict";
/**
 * Flow Service - Question flow management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowService = void 0;
const questions_json_1 = __importDefault(require("../../questions.json"));
class FlowService {
    constructor() {
        this.questions = questions_json_1.default.flow;
    }
    /**
     * Get next question based on answers
     */
    getNextQuestion(answers, lang = 'ja') {
        // If no answers, start with Q0
        if (answers.length === 0) {
            return this.formatQuestion('Q0', lang, 0);
        }
        // Get last answer
        const lastAnswer = answers[answers.length - 1];
        const lastQuestion = this.questions[lastAnswer.question_id];
        // Determine next question ID
        let nextQuestionId;
        if (lastQuestion.options) {
            // Find the selected option
            const selectedOption = lastQuestion.options.find((opt) => opt.id === lastAnswer.answer_option || opt.id.toLowerCase() === lastAnswer.answer_option.toLowerCase());
            if (selectedOption?.next) {
                nextQuestionId = selectedOption.next;
            }
            else if (lastQuestion.next) {
                nextQuestionId = lastQuestion.next;
            }
            else {
                // End of flow
                return this.handleEndOfFlow(answers);
            }
        }
        else if (lastQuestion.next) {
            nextQuestionId = lastQuestion.next;
        }
        else {
            return this.handleEndOfFlow(answers);
        }
        // Handle special cases
        if (nextQuestionId === 'CALCULATE_HIGHEST_MOTIVATION') {
            return this.calculateHighestMotivation(answers, lang);
        }
        if (nextQuestionId === 'GENERATE_RESULT') {
            return {
                completed: true,
                message: 'All questions completed. Ready to generate result.'
            };
        }
        // Calculate step count (exclude Q0 from count)
        const stepCount = answers.filter(a => a.question_id !== 'Q0').length;
        // Return next question
        return this.formatQuestion(nextQuestionId, lang, stepCount);
    }
    /**
     * Calculate highest motivation（廃止：新questions.jsonでは不要）
     * 新バージョンではサブタイプ質問がないため、このメソッドは呼ばれない
     */
    calculateHighestMotivation(answers, lang) {
        // 新questions.jsonでは使用されないが、互換性のため残す
        console.warn('calculateHighestMotivation is deprecated in v2.0');
        // GENERATE_RESULTに直接進む
        return {
            completed: true,
            message: 'All questions completed. Ready to generate result.'
        };
    }
    /**
     * Format question for response
     */
    formatQuestion(questionId, lang, currentStep) {
        const question = this.questions[questionId];
        if (!question) {
            throw new Error(`Question ${questionId} not found`);
        }
        // Calculate progress (exclude Q0 from step count)
        // currentStep is the number of answers so far (excluding Q0)
        // This question is step currentStep + 1 (unless it's Q0)
        const totalSteps = this.estimateTotalSteps();
        const adjustedStep = questionId === 'Q0' ? 0 : currentStep + 1;
        const percentage = Math.round((adjustedStep / totalSteps) * 100);
        return {
            question: {
                id: question.id,
                type: question.type,
                text: question.text,
                options: question.options?.map((opt) => ({
                    id: opt.id,
                    text: opt.text
                }))
            },
            progress: {
                current_step: adjustedStep,
                total_steps: totalSteps,
                percentage
            }
        };
    }
    /**
     * Estimate total steps based on new question flow
     */
    estimateTotalSteps() {
        // Q1（性別） + Q2-Q16（15問） = 16問
        // Q0は導入なのでカウントしない
        return 16;
    }
    /**
     * Handle end of flow
     */
    handleEndOfFlow(answers) {
        return {
            completed: true,
            message: 'All questions completed. Ready to generate result.'
        };
    }
    /**
     * Validate if all required questions are answered
     */
    validateComplete(answers) {
        // 新questions.json: Q0 + Q1 + Q2-Q16 = 18回答
        // Q0は任意、最低でもQ1とQ2-Q16の17回答が必要
        return answers.length >= 17;
    }
    /**
     * Get question by ID
     */
    getQuestion(questionId, lang = 'ja') {
        const question = this.questions[questionId];
        if (!question) {
            return null;
        }
        return {
            id: question.id,
            type: question.type,
            text: question.text,
            options: question.options?.map((opt) => ({
                id: opt.id,
                text: opt.text
            }))
        };
    }
}
exports.FlowService = FlowService;
