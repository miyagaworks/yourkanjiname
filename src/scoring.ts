/**
 * YourKanjiName Scoring Logic v2.0
 * 新しい質問構造（Q2-Q16）に対応したスコアリング実装
 */

import questionsData from '../questions.json';

// ===================================
// 型定義
// ===================================

export type GenderDeclaration = 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say';

export type MotivationType =
  | 'knowledge'
  | 'creative'
  | 'belonging'
  | 'dominance'
  | 'stability'
  | 'freedom';

export interface GenderTraitScore {
  declared_gender: GenderDeclaration;
  trait_score: number; // 性別特性スコア（負=女性的、正=男性的）
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

export interface BehavioralTraits {
  decisiveness: number;
  action_oriented: number;
  consistency: number;
}

export interface ScoringResult {
  gender_profile: GenderTraitScore;
  motivation_scores: MotivationScores;
  highest_motivation: MotivationType;
  behavioral_traits: BehavioralTraits;
}

export interface Answer {
  question_id: string;
  answer_option: string;
}

// ===================================
// 性別性質スコアリング（新バージョン）
// ===================================

export class GenderTraitCalculator {
  /**
   * 性別性質スコアを計算（questions.jsonから動的に取得）
   * @param declared_gender 申告された性別
   * @param answers Q2-Q16の回答
   * @returns GenderTraitScore
   */
  static calculate(
    declared_gender: GenderDeclaration,
    answers: Answer[]
  ): GenderTraitScore {
    let trait_score = 0;

    // 回答から性質スコアを集計（questions.jsonから動的に取得）
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
   * questions.jsonから質問の回答オプションに含まれるgender_traitスコアを取得
   */
  private static getAnswerScore(question_id: string, answer_option: string): number {
    const question = (questionsData as any).flow[question_id];
    if (!question || !question.options) return 0;

    const option = question.options.find((opt: any) => opt.id === answer_option);
    return option?.scores?.gender_trait ?? 0;
  }

  /**
   * 性別申告とスコアからカテゴリを決定
   */
  private static determineCategory(
    declared_gender: GenderDeclaration,
    trait_score: number
  ): GenderTraitScore['category'] {
    if (declared_gender === 'male') {
      if (trait_score >= 10) return 'strong_masculine';
      if (trait_score >= 3) return 'soft_masculine';
      return 'neutral';
    } else if (declared_gender === 'female') {
      if (trait_score <= -10) return 'strong_feminine';
      if (trait_score <= -3) return 'soft_feminine';
      return 'neutral';
    } else if (declared_gender === 'nonbinary') {
      // Nonbinary: より中立的な結果を返す（強い性別カテゴリは使用しない）
      if (trait_score >= 5) return 'soft_masculine';
      if (trait_score <= -5) return 'soft_feminine';
      return 'neutral';
    } else {
      // prefer_not_to_say
      return 'neutral';
    }
  }
}

// ===================================
// 動機スコアリング（新バージョン）
// ===================================

export class MotivationCalculator {
  /**
   * 6つの根源的動機スコアを計算（questions.jsonから動的に取得）
   * @param answers Q2-Q16の回答
   * @returns MotivationScores
   */
  static calculate(answers: Answer[]): MotivationScores {
    const scores: MotivationScores = {
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
        scores[motivation as MotivationType] += score;
      }
    }

    return scores;
  }

  /**
   * questions.jsonから動機スコアを取得
   */
  private static getMotivationScores(question_id: string, answer_option: string): Partial<MotivationScores> {
    const question = (questionsData as any).flow[question_id];
    if (!question || !question.options) return {};

    const option = question.options.find((opt: any) => opt.id === answer_option);
    return option?.scores?.motivation ?? {};
  }

  /**
   * 最高スコアの動機を特定
   */
  static findHighestMotivation(scores: MotivationScores): MotivationType {
    let highest: MotivationType = 'knowledge';
    let highestScore = scores.knowledge;

    for (const [motivation, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highest = motivation as MotivationType;
        highestScore = score;
      }
    }

    return highest;
  }
}

// ===================================
// 行動特性スコアリング（新バージョン）
// ===================================

export class BehavioralTraitsCalculator {
  /**
   * 行動特性スコアを計算（questions.jsonから動的に取得）
   * @param answers Q2-Q16の回答
   * @returns BehavioralTraits
   */
  static calculate(answers: Answer[]): BehavioralTraits {
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
   * questions.jsonから行動特性スコアを取得
   */
  private static getTraitScores(question_id: string, answer_option: string): Partial<BehavioralTraits> {
    const question = (questionsData as any).flow[question_id];
    if (!question || !question.options) return {};

    const option = question.options.find((opt: any) => opt.id === answer_option);
    const scores = option?.scores ?? {};

    return {
      decisiveness: scores.decisiveness,
      action_oriented: scores.action_oriented,
      consistency: scores.consistency
    };
  }
}

// ===================================
// 統合スコアリングエンジン（新バージョン）
// ===================================

export class ScoringEngine {
  /**
   * 全ての回答からスコアリング結果を生成（新questions.json対応）
   * @param allAnswers セッション内の全回答（Q0, Q1, Q2-Q16）
   * @returns ScoringResult
   */
  static processAnswers(allAnswers: Answer[]): ScoringResult {
    // 性別申告を取得
    const genderAnswer = allAnswers.find(a => a.question_id === 'Q1');
    const declared_gender = genderAnswer?.answer_option.toLowerCase() as GenderDeclaration ?? 'prefer_not_to_say';

    // Q2-Q16の回答を取得
    const mainAnswers = allAnswers.filter(a =>
      a.question_id.match(/^Q([2-9]|1[0-6])$/)
    );

    // 性別性質スコアを計算（Q2-Q16から）
    const gender_profile = GenderTraitCalculator.calculate(declared_gender, mainAnswers);

    // 動機スコアを計算（Q2-Q16から）
    const motivation_scores = MotivationCalculator.calculate(mainAnswers);
    const highest_motivation = MotivationCalculator.findHighestMotivation(motivation_scores);

    // 行動特性スコアを計算（Q2-Q16から）
    const behavioral_traits = BehavioralTraitsCalculator.calculate(mainAnswers);

    return {
      gender_profile,
      motivation_scores,
      highest_motivation,
      behavioral_traits
    };
  }

  /**
   * スコアリング結果をログ出力
   */
  static printResult(result: ScoringResult): void {
    console.log('=== Scoring Result (v2.0) ===');
    console.log('Gender Profile:');
    console.log(`  Declared: ${result.gender_profile.declared_gender}`);
    console.log(`  Trait Score: ${result.gender_profile.trait_score}`);
    console.log(`  Category: ${result.gender_profile.category}`);
    console.log('');
    console.log('Behavioral Traits:');
    console.log(`  Decisiveness: ${result.behavioral_traits.decisiveness}`);
    console.log(`  Action-Oriented: ${result.behavioral_traits.action_oriented}`);
    console.log(`  Consistency: ${result.behavioral_traits.consistency}`);
    console.log('');
    console.log('Motivation Scores:');
    for (const [motivation, score] of Object.entries(result.motivation_scores)) {
      console.log(`  ${motivation}: ${score}`);
    }
    console.log(`  Highest: ${result.highest_motivation}`);
    console.log('==============================');
  }
}

// ===================================
// エクスポート
// ===================================

export default {
  GenderTraitCalculator,
  MotivationCalculator,
  BehavioralTraitsCalculator,
  ScoringEngine
};