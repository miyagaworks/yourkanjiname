/**
 * YourKanjiName - Kanji Matching Algorithm
 * 新システム用漢字マッチングアルゴリズム
 */

import type { ScoringResult, MotivationType, MotivationSubtype } from './scoring';
import type { KanjiData, GenderAssociation } from './src/data/kanjiDatabase';

// ===================================
// 型定義
// ===================================

export interface KanjiScore {
  kanji: string;
  kanjiData: KanjiData;
  totalScore: number;
  genderScore: number;
  motivationScore: number;
  subtypeScore: number;
}

export interface KanjiPairScore {
  first: KanjiScore;
  second: KanjiScore;
  combinedScore: number;
  harmonyScore: number;
}

export interface MatchingResult {
  kanji_name: string;
  first_kanji: KanjiScore;
  second_kanji: KanjiScore;
  total_score: number;
  explanation: {
    ja: string;
    en: string;
  };
}

// ===================================
// 旧システムから新システムへのマッピング
// ===================================

/**
 * 職業タイプから動機タイプへのマッピング
 */
const OCCUPATION_TO_MOTIVATION: Record<string, MotivationType[]> = {
  'BUSINESS_OWNER': ['dominance', 'knowledge'],
  'EXECUTIVE': ['dominance', 'knowledge'],
  'MANAGER': ['dominance', 'stability'],
  'ENTREPRENEUR': ['freedom', 'creative'],
  'ENGINEER': ['knowledge', 'creative'],
  'RESEARCHER': ['knowledge', 'stability'],
  'DOCTOR': ['knowledge', 'belonging'],
  'NURSE': ['belonging', 'stability'],
  'TEACHER': ['knowledge', 'belonging'],
  'ARTIST': ['creative', 'freedom'],
  'DESIGNER': ['creative', 'knowledge'],
  'WRITER': ['creative', 'freedom'],
  'MUSICIAN': ['creative', 'freedom'],
  'ATHLETE': ['dominance', 'freedom'],
  'CHEF': ['creative', 'knowledge'],
  'SALES': ['belonging', 'dominance'],
  'MARKETING': ['creative', 'belonging'],
  'CONSULTANT': ['knowledge', 'dominance'],
  'LAWYER': ['knowledge', 'dominance'],
  'ACCOUNTANT': ['knowledge', 'stability'],
  'PROGRAMMER': ['knowledge', 'creative'],
  'DATA_SCIENTIST': ['knowledge', 'creative'],
  'SERVICE': ['belonging', 'stability'],
  'PUBLIC_SERVANT': ['stability', 'belonging'],
  'POLICE': ['dominance', 'stability'],
  'FIREFIGHTER': ['dominance', 'belonging'],
  'FARMER': ['stability', 'freedom'],
  'ARTISAN': ['creative', 'stability']
};

/**
 * 趣味タイプから動機タイプへのマッピング
 */
const HOBBY_TO_MOTIVATION: Record<string, MotivationType[]> = {
  'READING': ['knowledge', 'freedom'],
  'WRITING': ['creative', 'freedom'],
  'MUSIC': ['creative', 'freedom'],
  'SPORTS': ['dominance', 'freedom'],
  'TRAVEL': ['freedom', 'creative'],
  'COOKING': ['creative', 'belonging'],
  'GARDENING': ['stability', 'creative'],
  'PHOTOGRAPHY': ['creative', 'knowledge'],
  'PAINTING': ['creative', 'freedom'],
  'GAMING': ['dominance', 'freedom'],
  'COLLECTING': ['stability', 'knowledge'],
  'VOLUNTEERING': ['belonging', 'stability'],
  'SOCIALIZING': ['belonging', 'freedom'],
  'MEDITATION': ['stability', 'knowledge'],
  'EXERCISE': ['stability', 'dominance'],
  'CRAFTS': ['creative', 'stability'],
  'LEARNING': ['knowledge', 'creative'],
  'TECHNOLOGY': ['knowledge', 'creative'],
  'FASHION': ['creative', 'belonging'],
  'MOVIES': ['creative', 'freedom']
};

/**
 * コミュニケーションレベルから動機タイプへのマッピング
 */
const COMMUNICATION_TO_MOTIVATION: Record<string, MotivationType[]> = {
  'VERY_HIGH': ['belonging', 'dominance'],
  'HIGH': ['belonging', 'creative'],
  'MODERATE': ['belonging', 'stability'],
  'LOW': ['freedom', 'knowledge'],
  'VERY_LOW': ['freedom', 'stability']
};

/**
 * 将来展望レベルから動機タイプへのマッピング
 */
const FUTURE_OUTLOOK_TO_MOTIVATION: Record<string, MotivationType[]> = {
  'VERY_POSITIVE': ['dominance', 'creative'],
  'POSITIVE': ['creative', 'knowledge'],
  'MODERATE': ['stability', 'knowledge'],
  'CAUTIOUS': ['stability', 'knowledge'],
  'PESSIMISTIC': ['stability', 'belonging']
};

// ===================================
// 性別適合スコア計算
// ===================================

export class GenderMatchingCalculator {
  /**
   * 性別カテゴリと漢字の性別適合度を計算
   */
  static calculate(
    userGenderCategory: 'strong_masculine' | 'soft_masculine' | 'neutral' | 'soft_feminine' | 'strong_feminine',
    kanjiGender: GenderAssociation
  ): number {
    const scoreMatrix: Record<string, Record<GenderAssociation, number>> = {
      'strong_masculine': { 'MASCULINE': 100, 'NEUTRAL': 60, 'FEMININE': 20 },
      'soft_masculine': { 'MASCULINE': 80, 'NEUTRAL': 90, 'FEMININE': 50 },
      'neutral': { 'MASCULINE': 60, 'NEUTRAL': 100, 'FEMININE': 60 },
      'soft_feminine': { 'MASCULINE': 50, 'NEUTRAL': 90, 'FEMININE': 80 },
      'strong_feminine': { 'MASCULINE': 20, 'NEUTRAL': 60, 'FEMININE': 100 }
    };

    return scoreMatrix[userGenderCategory][kanjiGender] || 50;
  }
}

// ===================================
// 動機適合スコア計算
// ===================================

export class MotivationMatchingCalculator {
  /**
   * ユーザーの動機スコアと漢字の適合度を計算
   */
  static calculate(
    userMotivation: MotivationType,
    userMotivationScore: number,
    kanjiData: KanjiData
  ): number {
    let score = 0;
    const maxMotivationScore = 10; // Q6-Q9の最大スコア

    // 職業タイプからのマッチング
    if (kanjiData.occupationTypes) {
      for (const occupation of kanjiData.occupationTypes) {
        const mappedMotivations = OCCUPATION_TO_MOTIVATION[occupation.type] || [];
        if (mappedMotivations.includes(userMotivation)) {
          score += 40;
        } else if (mappedMotivations.length > 0) {
          score += 10;
        }
      }
    }

    // 趣味タイプからのマッチング
    if (kanjiData.hobbyTypes) {
      for (const hobby of kanjiData.hobbyTypes) {
        const mappedMotivations = HOBBY_TO_MOTIVATION[hobby.type] || [];
        if (mappedMotivations.includes(userMotivation)) {
          score += 30;
        } else if (mappedMotivations.length > 0) {
          score += 5;
        }
      }
    }

    // コミュニケーションレベルからのマッチング
    if (kanjiData.communicationLevel) {
      const mappedMotivations = COMMUNICATION_TO_MOTIVATION[kanjiData.communicationLevel.level] || [];
      if (mappedMotivations.includes(userMotivation)) {
        score += 20;
      }
    }

    // 将来展望からのマッチング
    if (kanjiData.futureOutlookLevel) {
      const mappedMotivations = FUTURE_OUTLOOK_TO_MOTIVATION[kanjiData.futureOutlookLevel.level] || [];
      if (mappedMotivations.includes(userMotivation)) {
        score += 20;
      }
    }

    // ユーザーの動機スコアの強さに応じて調整
    const motivationStrength = userMotivationScore / maxMotivationScore;
    score = score * (0.7 + 0.3 * motivationStrength);

    return Math.min(100, score);
  }
}

// ===================================
// サブタイプ適合スコア計算
// ===================================

export class SubtypeMatchingCalculator {
  /**
   * サブタイプマッピング
   */
  private static SUBTYPE_TO_OCCUPATION: Record<string, string[]> = {
    // 知識欲系
    'truth_seeking': ['RESEARCHER', 'SCIENTIST', 'PHILOSOPHER', 'ACADEMIC'],
    'learning_growth': ['TEACHER', 'CONSULTANT', 'TRAINER', 'COACH'],
    'understanding_sharing': ['TEACHER', 'WRITER', 'JOURNALIST', 'EDUCATOR'],

    // 創造欲系
    'pure_creation': ['CREATIVE', 'ARTIST', 'DESIGNER', 'ARCHITECT', 'MUSICIAN'],
    'innovation_transformation': ['CREATIVE', 'ENTREPRENEUR', 'ENGINEER', 'INVENTOR', 'CHEF'],
    'expression_communication': ['CREATIVE', 'WRITER', 'ARTIST', 'PERFORMER', 'CONTENT'],

    // 所属欲系
    'pure_love_devotion': ['NURSE', 'CAREGIVER', 'COUNSELOR', 'THERAPIST'],
    'harmony_cooperation': ['HR', 'MEDIATOR', 'FACILITATOR', 'COORDINATOR'],
    'protection_nurturing': ['TEACHER', 'DOCTOR', 'SOCIAL_WORKER', 'PARENT'],

    // 支配欲系
    'leadership_command': ['EXECUTIVE', 'MANAGER', 'MILITARY', 'DIRECTOR'],
    'competition_victory': ['ATHLETE', 'SALES', 'COMPETITOR', 'CHAMPION'],
    'influence_change': ['POLITICIAN', 'ACTIVIST', 'LEADER', 'INFLUENCER'],

    // 安定欲系
    'peace_rest': ['LIBRARIAN', 'GARDENER', 'MONK', 'MEDITATION_TEACHER'],
    'continuity_maintenance': ['ACCOUNTANT', 'ARCHIVIST', 'CURATOR', 'PRESERVER'],
    'deep_rooted_belief': ['PHILOSOPHER', 'RELIGIOUS_LEADER', 'JUDGE', 'ETHICIST'],

    // 自由欲系
    'liberation_independence': ['FREELANCER', 'ENTREPRENEUR', 'NOMAD', 'INDEPENDENT'],
    'adventure_exploration': ['EXPLORER', 'ADVENTURER', 'TRAVELER', 'PILOT'],
    'individuality_expression': ['ARTIST', 'DESIGNER', 'FASHION', 'CREATOR']
  };

  private static SUBTYPE_TO_HOBBY: Record<string, string[]> = {
    'truth_seeking': ['READING', 'RESEARCH', 'LEARNING', 'PHILOSOPHY'],
    'learning_growth': ['LEARNING', 'COURSES', 'SKILLS', 'DEVELOPMENT'],
    'understanding_sharing': ['TEACHING', 'BLOGGING', 'MENTORING', 'WRITING'],

    'pure_creation': ['ARTS', 'PAINTING', 'SCULPTURE', 'MUSIC', 'CRAFTS'],
    'innovation_transformation': ['ARTS', 'INVENTING', 'CODING', 'ENGINEERING', 'COOKING', 'TRAVEL'],
    'expression_communication': ['ARTS', 'WRITING', 'PERFORMING', 'CONTENT', 'VLOGGING'],

    'pure_love_devotion': ['VOLUNTEERING', 'CARING', 'CHARITY', 'HELPING'],
    'harmony_cooperation': ['SOCIALIZING', 'TEAM_SPORTS', 'COMMUNITY', 'EVENTS'],
    'protection_nurturing': ['VOLUNTEERING', 'MENTORING', 'TEACHING', 'CARING'],

    'leadership_command': ['LEADING', 'MANAGING', 'ORGANIZING', 'DIRECTING'],
    'competition_victory': ['SPORTS', 'GAMING', 'COMPETITIONS', 'RACING'],
    'influence_change': ['ACTIVISM', 'POLITICS', 'CAMPAIGNING', 'ADVOCACY'],

    'peace_rest': ['MEDITATION', 'YOGA', 'GARDENING', 'READING'],
    'continuity_maintenance': ['COLLECTING', 'ARCHIVING', 'ORGANIZING', 'PRESERVING'],
    'deep_rooted_belief': ['PHILOSOPHY', 'RELIGION', 'ETHICS', 'MEDITATION'],

    'liberation_independence': ['SOLO_TRAVEL', 'FREELANCING', 'INDEPENDENCE', 'SOLITUDE'],
    'adventure_exploration': ['TRAVEL', 'HIKING', 'EXPLORATION', 'ADVENTURE'],
    'individuality_expression': ['FASHION', 'ART', 'UNIQUE_HOBBIES', 'CREATIVITY']
  };

  /**
   * サブタイプ適合度を計算
   */
  static calculate(
    userSubtype: MotivationSubtype,
    subtypeScore: number,
    kanjiData: KanjiData
  ): number {
    let score = 0;
    const relevantOccupations = this.SUBTYPE_TO_OCCUPATION[userSubtype] || [];
    const relevantHobbies = this.SUBTYPE_TO_HOBBY[userSubtype] || [];

    // 職業マッチング
    if (kanjiData.occupationTypes) {
      for (const occupation of kanjiData.occupationTypes) {
        const occupationType = occupation.type;
        if (relevantOccupations.some(occ => occupationType.includes(occ))) {
          score += 50;
        }
      }
    }

    // 趣味マッチング
    if (kanjiData.hobbyTypes) {
      for (const hobby of kanjiData.hobbyTypes) {
        const hobbyType = hobby.type;
        if (relevantHobbies.some(hob => hobbyType.includes(hob))) {
          score += 40;
        }
      }
    }

    // サブタイプスコアの強さに応じて調整
    const maxSubtypeScore = 5; // Q10-Q11の最大スコア
    const subtypeStrength = subtypeScore / maxSubtypeScore;
    score = score * (0.6 + 0.4 * subtypeStrength);

    return Math.min(100, score);
  }
}

// ===================================
// 総合マッチングエンジン
// ===================================

export class KanjiMatchingEngine {
  /**
   * 全漢字に対してスコアリング
   */
  static scoreAllKanji(
    scoringResult: ScoringResult,
    kanjiDatabase: Record<string, KanjiData>
  ): KanjiScore[] {
    const scores: KanjiScore[] = [];

    for (const [kanji, kanjiData] of Object.entries(kanjiDatabase)) {
      // 性別適合スコア
      const genderScore = GenderMatchingCalculator.calculate(
        scoringResult.gender_profile.category,
        kanjiData.genderAssociation
      );

      // 動機適合スコア
      const motivationScore = MotivationMatchingCalculator.calculate(
        scoringResult.highest_motivation,
        scoringResult.motivation_scores[scoringResult.highest_motivation],
        kanjiData
      );

      // サブタイプ適合スコア
      const subtypeScore = SubtypeMatchingCalculator.calculate(
        scoringResult.highest_subtype,
        scoringResult.subtype_scores[scoringResult.highest_subtype],
        kanjiData
      );

      // 総合スコア(重み付け平均)
      const totalScore = (
        genderScore * 0.3 +
        motivationScore * 0.4 +
        subtypeScore * 0.3
      );

      scores.push({
        kanji,
        kanjiData,
        totalScore,
        genderScore,
        motivationScore,
        subtypeScore
      });
    }

    // スコア降順でソート
    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * 漢字ペアの調和度を計算
   */
  static calculateHarmony(first: KanjiScore, second: KanjiScore): number {
    let harmonyScore = 70; // ベーススコア

    // 性別適合の調和
    if (first.kanjiData.genderAssociation === second.kanjiData.genderAssociation) {
      harmonyScore += 15;
    } else if (
      first.kanjiData.genderAssociation === 'NEUTRAL' ||
      second.kanjiData.genderAssociation === 'NEUTRAL'
    ) {
      harmonyScore += 10;
    }

    // 選択タイプの多様性(異なる方が良い)
    if (first.kanjiData.selectionType !== second.kanjiData.selectionType) {
      harmonyScore += 10;
    }

    // スコア差が大きすぎない方が良い
    const scoreDiff = Math.abs(first.totalScore - second.totalScore);
    if (scoreDiff < 10) {
      harmonyScore += 10;
    } else if (scoreDiff < 20) {
      harmonyScore += 5;
    }

    return Math.min(100, harmonyScore);
  }

  /**
   * 最適な漢字ペアを選択
   */
  static selectBestPair(
    scoringResult: ScoringResult,
    kanjiDatabase: Record<string, KanjiData>,
    topN: number = 20
  ): KanjiPairScore {
    // 全漢字をスコアリング
    const allScores = this.scoreAllKanji(scoringResult, kanjiDatabase);

    // 上位N個を候補とする
    const topCandidates = allScores.slice(0, topN);

    // 全ペア組み合わせを評価
    let bestPair: KanjiPairScore | null = null;
    let bestCombinedScore = 0;

    for (let i = 0; i < topCandidates.length; i++) {
      for (let j = i + 1; j < topCandidates.length; j++) {
        const first = topCandidates[i];
        const second = topCandidates[j];

        // 同じ漢字は除外
        if (first.kanji === second.kanji) continue;

        // 調和度を計算
        const harmonyScore = this.calculateHarmony(first, second);

        // 総合スコア
        const combinedScore = (
          first.totalScore * 0.4 +
          second.totalScore * 0.4 +
          harmonyScore * 0.2
        );

        if (combinedScore > bestCombinedScore) {
          bestCombinedScore = combinedScore;
          bestPair = {
            first,
            second,
            combinedScore,
            harmonyScore
          };
        }
      }
    }

    if (!bestPair) {
      // フォールバック: 上位2つを選択
      bestPair = {
        first: topCandidates[0],
        second: topCandidates[1],
        combinedScore: (topCandidates[0].totalScore + topCandidates[1].totalScore) / 2,
        harmonyScore: this.calculateHarmony(topCandidates[0], topCandidates[1])
      };
    }

    return bestPair;
  }

  /**
   * 説明文を生成
   */
  static generateExplanation(
    pair: KanjiPairScore,
    scoringResult: ScoringResult
  ): { ja: string; en: string } {
    const motivationNames = {
      knowledge: { ja: '知識への探究心', en: 'thirst for knowledge' },
      creative: { ja: '創造への情熱', en: 'passion for creativity' },
      belonging: { ja: '人との絆', en: 'connection with others' },
      dominance: { ja: 'リーダーシップ', en: 'leadership' },
      stability: { ja: '安定への希求', en: 'desire for stability' },
      freedom: { ja: '自由への憧れ', en: 'yearning for freedom' }
    };

    const motivation = motivationNames[scoringResult.highest_motivation];

    const ja = `あなたの${motivation.ja}と内なる性質を表現した名前です。「${pair.first.kanji}」は${pair.first.kanjiData.meaning.ja}を、「${pair.second.kanji}」は${pair.second.kanjiData.meaning.ja}を象徴しています。`;

    const en = `This name expresses your ${motivation.en} and inner nature. "${pair.first.kanji}" symbolizes ${pair.first.kanjiData.meaning.en}, while "${pair.second.kanji}" represents ${pair.second.kanjiData.meaning.en}.`;

    return { ja, en };
  }

  /**
   * 最終結果を生成
   */
  static generateResult(
    scoringResult: ScoringResult,
    kanjiDatabase: Record<string, KanjiData>
  ): MatchingResult {
    const bestPair = this.selectBestPair(scoringResult, kanjiDatabase);
    const explanation = this.generateExplanation(bestPair, scoringResult);

    return {
      kanji_name: bestPair.first.kanji + bestPair.second.kanji,
      first_kanji: bestPair.first,
      second_kanji: bestPair.second,
      total_score: bestPair.combinedScore,
      explanation
    };
  }
}

// ===================================
// エクスポート
// ===================================

export default {
  GenderMatchingCalculator,
  MotivationMatchingCalculator,
  SubtypeMatchingCalculator,
  KanjiMatchingEngine
};