"use strict";
/**
 * Question Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const QuestionService_1 = require("../services/QuestionService");
const router = express_1.default.Router();
const questionService = new QuestionService_1.QuestionService();
/**
 * GET /api/questions/:question_id
 * Get a specific question
 */
router.get('/:question_id', async (req, res, next) => {
    try {
        const { question_id } = req.params;
        const lang = req.query.lang || 'ja';
        const question = await questionService.getQuestion(question_id, lang);
        if (!question) {
            return res.status(404).json({
                error: {
                    code: 'QUESTION_NOT_FOUND',
                    message: 'The specified question does not exist'
                }
            });
        }
        res.json(question);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
