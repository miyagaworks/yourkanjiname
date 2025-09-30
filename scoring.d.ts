/**
 * YourKanjiName Scoring Logic
 * スコアリングロジック実装
 */
export type GenderDeclaration = 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say';
export type MotivationType = 'knowledge' | 'creative' | 'belonging' | 'dominance' | 'stability' | 'freedom';
export type KnowledgeSubtype = 'truth_seeking' | 'learning_growth' | 'understanding_sharing';
export type CreativeSubtype = 'pure_creation' | 'innovation_transformation' | 'expression_communication';
export type BelongingSubtype = 'pure_love_devotion' | 'harmony_cooperation' | 'protection_nurturing';
export type DominanceSubtype = 'leadership_command' | 'competition_victory' | 'influence_change';
export type StabilitySubtype = 'peace_rest' | 'continuity_maintenance' | 'deep_rooted_belief';
export type FreedomSubtype = 'liberation_independence' | 'adventure_exploration' | 'individuality_expression';
export type MotivationSubtype = KnowledgeSubtype | CreativeSubtype | BelongingSubtype | DominanceSubtype | StabilitySubtype | FreedomSubtype;
export interface GenderTraitScore {
    declared_gender: GenderDeclaration;
    trait_score: number;
    category: 'strong_masculine' | 'soft_masculine' | 'neutral' | 'soft_feminine' | 'strong_feminine';
}
export interface MotivationScores {
    knowledge: number;
    creative: number;
    belonging: number;
    dominance: number;
    stability: number;
    freedom: number;
}
export interface MotivationSubtypeScores {
    [key: string]: number;
}
export interface BehavioralTraits {
    decisiveness: number;
    action_oriented: number;
    consistency: number;
}
export interface ScoringResult {
    gender_profile: GenderTraitScore;
    motivation_scores: MotivationScores;
    highest_motivation: MotivationType;
    subtype_scores: MotivationSubtypeScores;
    highest_subtype: MotivationSubtype;
    behavioral_traits: BehavioralTraits;
}
export interface Answer {
    question_id: string;
    answer_option: string;
}
export declare class GenderTraitCalculator {
    /**
     * 性別性質スコアを計算
     * @param declared_gender 申告された性別
     * @param answers 性別確認質問の回答 (M-1~M-4, F-1~F-4, NB-1~NB-4)
     * @returns GenderTraitScore
     */
    static calculate(declared_gender: GenderDeclaration, answers: Answer[]): GenderTraitScore;
    /**
     * 質問IDと回答オプションからスコアを取得
     */
    private static getAnswerScore;
    /**
     * 性別申告とスコアからカテゴリを決定
     */
    private static determineCategory;
}
export declare class MotivationCalculator {
    /**
     * 6つの根源的動機スコアを計算
     * @param answers Q6-Q9の回答
     * @returns MotivationScores
     */
    static calculate(answers: Answer[]): MotivationScores;
    /**
     * 質問IDと回答オプションから動機スコアを取得
     */
    private static getMotivationScores;
    /**
     * 最高スコアの動機を特定
     */
    static findHighestMotivation(scores: MotivationScores): MotivationType;
}
export declare class BehavioralTraitsCalculator {
    /**
     * 行動特性スコアを計算
     * @param answers Q6, Q7, Q8, Q10の回答
     * @returns BehavioralTraits
     */
    static calculate(answers: Answer[]): BehavioralTraits;
    /**
     * 質問IDと回答オプションから行動特性スコアを取得
     */
    private static getTraitScores;
}
export declare class SubtypeCalculator {
    /**
     * サブタイプスコアを計算
     * @param motivation_type 動機タイプ
     * @param answers Q10-Q11の回答
     * @returns SubtypeScores
     */
    static calculate(motivation_type: MotivationType, answers: Answer[]): MotivationSubtypeScores;
    /**
     * 質問IDと回答オプションからサブタイプスコアを取得
     */
    private static getSubtypeScores;
    /**
     * 最高スコアのサブタイプを特定
     */
    static findHighestSubtype(scores: MotivationSubtypeScores): MotivationSubtype;
}
export declare class ScoringEngine {
    /**
     * 全ての回答からスコアリング結果を生成
     * @param allAnswers セッション内の全回答
     * @returns ScoringResult
     */
    static processAnswers(allAnswers: Answer[]): ScoringResult;
    /**
     * スコアリング結果をログ出力
     */
    static printResult(result: ScoringResult): void;
}
declare const _default: {
    GenderTraitCalculator: typeof GenderTraitCalculator;
    MotivationCalculator: typeof MotivationCalculator;
    BehavioralTraitsCalculator: typeof BehavioralTraitsCalculator;
    SubtypeCalculator: typeof SubtypeCalculator;
    ScoringEngine: typeof ScoringEngine;
};
export default _default;
//# sourceMappingURL=scoring.d.ts.map