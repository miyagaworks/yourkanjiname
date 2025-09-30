"use strict";
/**
 * YourKanjiName Scoring Logic
 * スコアリングロジック実装
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringEngine = exports.SubtypeCalculator = exports.BehavioralTraitsCalculator = exports.MotivationCalculator = exports.GenderTraitCalculator = void 0;
// ===================================
// 性別性質スコアリング
// ===================================
class GenderTraitCalculator {
    /**
     * 性別性質スコアを計算
     * @param declared_gender 申告された性別
     * @param answers 性別確認質問の回答 (M-1~M-4, F-1~F-4, NB-1~NB-4)
     * @returns GenderTraitScore
     */
    static calculate(declared_gender, answers) {
        let trait_score = 0;
        // 回答から性質スコアを集計
        for (const answer of answers) {
            const score = this.getAnswerScore(answer.question_id, answer.answer_option);
            trait_score += score;
        }
        // カテゴリを決定
        const category = this.determineCategory(declared_gender, trait_score);
        return {
            declared_gender,
            trait_score,
            category
        };
    }
    /**
     * 質問IDと回答オプションからスコアを取得
     */
    static getAnswerScore(question_id, answer_option) {
        // questions.jsonから動的に取得する実装も可能
        // ここでは簡易的に実装
        const scoreMap = {
            'M-1': { 'A': 3, 'B': 2, 'C': 0, 'D': -1, 'E': -2 },
            'M-2': { 'A': 3, 'B': 1, 'C': -1, 'D': -2 },
            'M-3': { 'A': 2, 'B': 1, 'C': -1, 'D': -2 },
            'M-4': { 'A': 2, 'B': 1, 'C': 0, 'D': -1 },
            'F-1': { 'A': 3, 'B': 2, 'C': 1, 'D': 0, 'E': -1 },
            'F-2': { 'A': 3, 'B': 2, 'C': 1, 'D': -1, 'E': -2 },
            'F-3': { 'A': 2, 'B': 2, 'C': -1, 'D': -2 },
            'F-4': { 'A': 3, 'B': 2, 'C': 1, 'D': -1 }
        };
        return scoreMap[question_id]?.[answer_option] ?? 0;
    }
    /**
     * 性別申告とスコアからカテゴリを決定
     */
    static determineCategory(declared_gender, trait_score) {
        if (declared_gender === 'male') {
            if (trait_score >= 6)
                return 'strong_masculine';
            if (trait_score >= 1)
                return 'soft_masculine';
            return 'neutral';
        }
        else if (declared_gender === 'female') {
            if (trait_score >= 6)
                return 'strong_feminine';
            if (trait_score >= 1)
                return 'soft_feminine';
            return 'neutral';
        }
        else if (declared_gender === 'nonbinary') {
            if (trait_score >= 6)
                return 'soft_masculine';
            if (trait_score >= 2)
                return 'soft_masculine';
            if (trait_score >= -1)
                return 'neutral';
            if (trait_score >= -5)
                return 'soft_feminine';
            return 'strong_feminine';
        }
        else {
            // prefer_not_to_say
            return 'neutral';
        }
    }
}
exports.GenderTraitCalculator = GenderTraitCalculator;
// ===================================
// 動機スコアリング
// ===================================
class MotivationCalculator {
    /**
     * 6つの根源的動機スコアを計算
     * @param answers Q6-Q9の回答
     * @returns MotivationScores
     */
    static calculate(answers) {
        const scores = {
            knowledge: 0,
            creative: 0,
            belonging: 0,
            dominance: 0,
            stability: 0,
            freedom: 0
        };
        for (const answer of answers) {
            const motivationScores = this.getMotivationScores(answer.question_id, answer.answer_option);
            for (const [motivation, score] of Object.entries(motivationScores)) {
                scores[motivation] += score;
            }
        }
        return scores;
    }
    /**
     * 質問IDと回答オプションから動機スコアを取得
     */
    static getMotivationScores(question_id, answer_option) {
        const scoreMap = {
            // Q7: ストレス対処 - 一部動機スコアも含む
            'Q7': {
                'A': { dominance: 1 },
                'B': { knowledge: 1 },
                'C': { belonging: 1 },
                'D': { stability: -1 }
            },
            // Q9: 実際の行動
            'Q9': {
                'A': { knowledge: 3 },
                'B': { creative: 3 },
                'C': { belonging: 3 },
                'D': { dominance: 3 },
                'E': { stability: 3 },
                'F': { freedom: 3 }
            },
            // Q10: 決断力（重要） - 一部動機スコアも含む
            'Q10': {
                'A': { freedom: 1 },
                'B': { knowledge: 1 },
                'C': { stability: 1 },
                'D': { belonging: 1 }
            },
            // Q11: 現在の充実感
            'Q11': {
                'A': { knowledge: 2 },
                'B': { creative: 2 },
                'C': { belonging: 2 },
                'D': { dominance: 2 },
                'E': { stability: 2 },
                'F': { freedom: 2 }
            },
            // Q12: 未来への願望
            'Q12': {
                'A': { knowledge: 3 },
                'B': { creative: 3 },
                'C': { belonging: 3 },
                'D': { dominance: 3 },
                'E': { stability: 3 },
                'F': { freedom: 3 }
            }
        };
        return scoreMap[question_id]?.[answer_option] ?? {};
    }
    /**
     * 最高スコアの動機を特定
     */
    static findHighestMotivation(scores) {
        let highest = 'knowledge';
        let highestScore = scores.knowledge;
        for (const [motivation, score] of Object.entries(scores)) {
            if (score > highestScore) {
                highest = motivation;
                highestScore = score;
            }
        }
        return highest;
    }
}
exports.MotivationCalculator = MotivationCalculator;
// ===================================
// 行動特性スコアリング
// ===================================
class BehavioralTraitsCalculator {
    /**
     * 行動特性スコアを計算
     * @param answers Q6, Q7, Q8, Q10の回答
     * @returns BehavioralTraits
     */
    static calculate(answers) {
        let decisiveness = 0;
        let action_oriented = 0;
        let consistency = 0;
        for (const answer of answers) {
            const traits = this.getTraitScores(answer.question_id, answer.answer_option);
            decisiveness += traits.decisiveness ?? 0;
            action_oriented += traits.action_oriented ?? 0;
            consistency += traits.consistency ?? 0;
        }
        return {
            decisiveness,
            action_oriented,
            consistency
        };
    }
    /**
     * 質問IDと回答オプションから行動特性スコアを取得
     */
    static getTraitScores(question_id, answer_option) {
        const scoreMap = {
            // Q6: 日常的決断力
            'Q6': {
                'A': { decisiveness: 3 },
                'B': { decisiveness: 1 },
                'C': { decisiveness: -1 },
                'D': { decisiveness: -2 }
            },
            // Q7: ストレス対処（行動力）
            'Q7': {
                'A': { action_oriented: 3 },
                'B': { action_oriented: 1 },
                'C': { action_oriented: -1 },
                'D': { action_oriented: -2 }
            },
            // Q8: 一貫性
            'Q8': {
                'A': { consistency: 3 },
                'B': { consistency: 1 },
                'C': { consistency: -1 },
                'D': { consistency: -2 }
            },
            // Q10: 重要な決断力
            'Q10': {
                'A': { decisiveness: 3 },
                'B': { decisiveness: 1 },
                'C': { decisiveness: -2 },
                'D': { decisiveness: -1 }
            }
        };
        return scoreMap[question_id]?.[answer_option] ?? {};
    }
}
exports.BehavioralTraitsCalculator = BehavioralTraitsCalculator;
// ===================================
// サブタイプスコアリング
// ===================================
class SubtypeCalculator {
    /**
     * サブタイプスコアを計算
     * @param motivation_type 動機タイプ
     * @param answers Q10-Q11の回答
     * @returns SubtypeScores
     */
    static calculate(motivation_type, answers) {
        const scores = {};
        for (const answer of answers) {
            const subtypeScores = this.getSubtypeScores(answer.question_id, answer.answer_option);
            for (const [subtype, score] of Object.entries(subtypeScores)) {
                scores[subtype] = (scores[subtype] ?? 0) + score;
            }
        }
        return scores;
    }
    /**
     * 質問IDと回答オプションからサブタイプスコアを取得
     */
    static getSubtypeScores(question_id, answer_option) {
        const scoreMap = {
            // 知識欲系
            'Q10-knowledge-A': {
                'A': { truth_seeking: 2 },
                'B': { learning_growth: 2 },
                'C': { understanding_sharing: 2 }
            },
            'Q11-knowledge-B': {
                'A': { truth_seeking: 3 },
                'B': { learning_growth: 3 },
                'C': { understanding_sharing: 3 }
            },
            // 創造欲系
            'Q10-creative-A': {
                'A': { pure_creation: 2 },
                'B': { innovation_transformation: 2 },
                'C': { expression_communication: 2 }
            },
            'Q11-creative-B': {
                'A': { pure_creation: 3 },
                'B': { innovation_transformation: 3 },
                'C': { expression_communication: 3 }
            },
            // 所属欲系
            'Q10-belonging-A': {
                'A': { pure_love_devotion: 2 },
                'B': { harmony_cooperation: 2 },
                'C': { protection_nurturing: 2 }
            },
            'Q11-belonging-B': {
                'A': { pure_love_devotion: 3 },
                'B': { harmony_cooperation: 3 },
                'C': { protection_nurturing: 3 }
            },
            // 支配欲系
            'Q10-dominance-A': {
                'A': { leadership_command: 2 },
                'B': { competition_victory: 2 },
                'C': { influence_change: 2 }
            },
            'Q11-dominance-B': {
                'A': { leadership_command: 3 },
                'B': { competition_victory: 3 },
                'C': { influence_change: 3 }
            },
            // 安定欲系
            'Q10-stability-A': {
                'A': { peace_rest: 2 },
                'B': { continuity_maintenance: 2 },
                'C': { deep_rooted_belief: 2 }
            },
            'Q11-stability-B': {
                'A': { peace_rest: 3 },
                'B': { continuity_maintenance: 3 },
                'C': { deep_rooted_belief: 3 }
            },
            // 自由欲系
            'Q10-freedom-A': {
                'A': { liberation_independence: 2 },
                'B': { adventure_exploration: 2 },
                'C': { individuality_expression: 2 }
            },
            'Q11-freedom-B': {
                'A': { liberation_independence: 3 },
                'B': { adventure_exploration: 3 },
                'C': { individuality_expression: 3 }
            }
        };
        return scoreMap[question_id]?.[answer_option] ?? {};
    }
    /**
     * 最高スコアのサブタイプを特定
     */
    static findHighestSubtype(scores) {
        let highest = '';
        let highestScore = 0;
        for (const [subtype, score] of Object.entries(scores)) {
            if (score > highestScore) {
                highest = subtype;
                highestScore = score;
            }
        }
        return highest;
    }
}
exports.SubtypeCalculator = SubtypeCalculator;
// ===================================
// 統合スコアリングエンジン
// ===================================
class ScoringEngine {
    /**
     * 全ての回答からスコアリング結果を生成
     * @param allAnswers セッション内の全回答
     * @returns ScoringResult
     */
    static processAnswers(allAnswers) {
        // 性別申告を取得
        const genderAnswer = allAnswers.find(a => a.question_id === 'Q1');
        const declared_gender = genderAnswer?.answer_option.toLowerCase() ?? 'prefer_not_to_say';
        // 性別性質スコアを計算
        const genderTraitAnswers = allAnswers.filter(a => a.question_id.match(/^(M|F|NB)-\d+$/));
        const gender_profile = GenderTraitCalculator.calculate(declared_gender, genderTraitAnswers);
        // 動機スコアを計算 (Q7, Q9, Q10, Q11, Q12)
        const motivationAnswers = allAnswers.filter(a => ['Q7', 'Q9', 'Q10', 'Q11', 'Q12'].includes(a.question_id));
        const motivation_scores = MotivationCalculator.calculate(motivationAnswers);
        const highest_motivation = MotivationCalculator.findHighestMotivation(motivation_scores);
        // 行動特性スコアを計算 (Q6, Q7, Q8, Q10)
        const behavioralAnswers = allAnswers.filter(a => ['Q6', 'Q7', 'Q8', 'Q10'].includes(a.question_id));
        const behavioral_traits = BehavioralTraitsCalculator.calculate(behavioralAnswers);
        // サブタイプスコアを計算
        const subtypeAnswers = allAnswers.filter(a => a.question_id.match(/^Q1[01]-/));
        const subtype_scores = SubtypeCalculator.calculate(highest_motivation, subtypeAnswers);
        const highest_subtype = SubtypeCalculator.findHighestSubtype(subtype_scores);
        return {
            gender_profile,
            motivation_scores,
            highest_motivation,
            subtype_scores,
            highest_subtype,
            behavioral_traits
        };
    }
    /**
     * スコアリング結果をログ出力
     */
    static printResult(result) {
        console.log('=== Scoring Result ===');
        console.log('Gender Profile:');
        console.log(`  Declared: ${result.gender_profile.declared_gender}`);
        console.log(`  Trait Score: ${result.gender_profile.trait_score}`);
        console.log(`  Category: ${result.gender_profile.category}`);
        console.log('');
        console.log('Behavioral Traits:');
        console.log(`  Decisiveness: ${result.behavioral_traits.decisiveness} (-4 to +6)`);
        console.log(`  Action-Oriented: ${result.behavioral_traits.action_oriented} (-2 to +3)`);
        console.log(`  Consistency: ${result.behavioral_traits.consistency} (-2 to +3)`);
        console.log('');
        console.log('Motivation Scores:');
        for (const [motivation, score] of Object.entries(result.motivation_scores)) {
            console.log(`  ${motivation}: ${score}`);
        }
        console.log(`  Highest: ${result.highest_motivation}`);
        console.log('');
        console.log('Subtype Scores:');
        for (const [subtype, score] of Object.entries(result.subtype_scores)) {
            console.log(`  ${subtype}: ${score}`);
        }
        console.log(`  Highest: ${result.highest_subtype}`);
        console.log('======================');
    }
}
exports.ScoringEngine = ScoringEngine;
// ===================================
// エクスポート
// ===================================
exports.default = {
    GenderTraitCalculator,
    MotivationCalculator,
    BehavioralTraitsCalculator,
    SubtypeCalculator,
    ScoringEngine
};
//# sourceMappingURL=scoring.js.map