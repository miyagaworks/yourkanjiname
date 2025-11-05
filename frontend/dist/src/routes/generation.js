"use strict";
/**
 * Generation Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const GenerationService_1 = require("../services/GenerationService");
const router = express_1.default.Router();
const generationService = new GenerationService_1.GenerationService();
/**
 * POST /api/sessions/:session_id/generate
 * Generate kanji name
 */
router.post('/:session_id/generate', async (req, res, next) => {
    try {
        const { session_id } = req.params;
        const result = await generationService.generateKanjiName(session_id);
        res.json(result);
    }
    catch (error) {
        if (error.code === 'INSUFFICIENT_ANSWERS') {
            return res.status(422).json({
                error: {
                    code: 'INSUFFICIENT_ANSWERS',
                    message: 'Not all questions have been answered yet'
                }
            });
        }
        next(error);
    }
});
/**
 * GET /api/sessions/:session_id/result
 * Get existing result
 */
router.get('/:session_id/result', async (req, res, next) => {
    try {
        const { session_id } = req.params;
        const result = await generationService.getResult(session_id);
        if (!result) {
            return res.status(404).json({
                error: {
                    code: 'RESULT_NOT_FOUND',
                    message: 'No result found for this session'
                }
            });
        }
        res.json(result);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
