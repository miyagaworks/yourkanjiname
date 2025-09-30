// src/services/KanjiMatchingService.ts
// Service for matching user profiles to appropriate kanji

import { Pool } from 'pg';

interface UserProfile {
  declared_gender: 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say';
  gender_trait_score: number;
  highest_motivation: string;
  motivation_scores: {
    knowledge: number;
    creative: number;
    belonging: number;
    dominance: number;
    stability: number;
    freedom: number;
  };
  subtype: string;
}

interface KanjiCandidate {
  kanji_id: number;
  kanji_char: string;
  meaning_ja: string;
  meaning_en: string;
  gender_category: string;
  masculinity_score: number;
  knowledge_affinity: number;
  creative_affinity: number;
  belonging_affinity: number;
  dominance_affinity: number;
  stability_affinity: number;
  freedom_affinity: number;
  total_score?: number;
  gender_score?: number;
  motivation_score?: number;
}

interface KanjiPair {
  first_kanji: KanjiCandidate;
  second_kanji: KanjiCandidate;
  total_score: number;
  gender_match: number;
  motivation_match: number;
}

export class KanjiMatchingService {
  private pool: Pool;

  // Scoring weights
  private static readonly GENDER_WEIGHT = 0.3;
  private static readonly MOTIVATION_WEIGHT = 0.7;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Find the best kanji pair for a user profile
   */
  async findBestKanjiPair(profile: UserProfile): Promise<KanjiPair> {
    // Step 1: Get all kanji from database
    const allKanji = await this.getAllKanji();

    // Step 2: Score each kanji for this profile
    const scoredKanji = this.scoreAllKanji(allKanji, profile);

    // Step 3: Get top candidates
    const topCandidates = scoredKanji
      .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
      .slice(0, 30);

    // Step 4: Find best pair from top candidates
    const bestPair = this.findBestPair(topCandidates, profile);

    return bestPair;
  }

  /**
   * Get all kanji from database
   */
  private async getAllKanji(): Promise<KanjiCandidate[]> {
    const result = await this.pool.query(`
      SELECT
        kanji_id,
        kanji_char,
        meaning_ja,
        meaning_en,
        gender_category,
        masculinity_score,
        knowledge_affinity,
        creative_affinity,
        belonging_affinity,
        dominance_affinity,
        stability_affinity,
        freedom_affinity
      FROM kanji_database
      ORDER BY kanji_id
    `);

    return result.rows;
  }

  /**
   * Score all kanji based on user profile
   */
  private scoreAllKanji(
    kanji: KanjiCandidate[],
    profile: UserProfile
  ): KanjiCandidate[] {
    return kanji.map(k => {
      // Gender score (30%)
      const genderScore = this.calculateGenderScore(
        k.masculinity_score,
        profile.gender_trait_score
      );

      // Motivation score (70%)
      const motivationScore = this.calculateMotivationScore(k, profile);

      // Total score
      const totalScore =
        genderScore * KanjiMatchingService.GENDER_WEIGHT +
        motivationScore * KanjiMatchingService.MOTIVATION_WEIGHT;

      return {
        ...k,
        gender_score: genderScore,
        motivation_score: motivationScore,
        total_score: totalScore
      };
    });
  }

  /**
   * Calculate gender matching score (0-100)
   */
  private calculateGenderScore(
    kanjiMasculinity: number,
    userGenderTrait: number
  ): number {
    // Both scores are on -10 to +10 scale
    // Perfect match = 100, opposite = 0
    const difference = Math.abs(kanjiMasculinity - userGenderTrait);
    const maxDifference = 20;
    return 100 * (1 - difference / maxDifference);
  }

  /**
   * Calculate motivation matching score (0-100)
   */
  private calculateMotivationScore(
    kanji: KanjiCandidate,
    profile: UserProfile
  ): number {
    const motivations = [
      'knowledge',
      'creative',
      'belonging',
      'dominance',
      'stability',
      'freedom'
    ];

    let totalScore = 0;
    let totalWeight = 0;

    for (const motivation of motivations) {
      const userScore = profile.motivation_scores[motivation as keyof typeof profile.motivation_scores];
      const kanjiAffinity = kanji[`${motivation}_affinity` as keyof KanjiCandidate] as number;

      // Weight by user's motivation score (higher motivation = more important)
      const weight = userScore;
      totalScore += kanjiAffinity * weight;
      totalWeight += weight;
    }

    // Normalize to 0-100 scale
    // Max kanji affinity is 10, so max possible is 10 * totalWeight
    return totalWeight > 0 ? (totalScore / (10 * totalWeight)) * 100 : 0;
  }

  /**
   * Find best pair of kanji from top candidates
   */
  private findBestPair(
    candidates: KanjiCandidate[],
    profile: UserProfile
  ): KanjiPair {
    let bestPair: KanjiPair | null = null;
    let bestScore = -1;

    // Try all pairs
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const first = candidates[i];
        const second = candidates[j];

        // Calculate pair score (average of both kanji)
        const pairScore = ((first.total_score || 0) + (second.total_score || 0)) / 2;
        const genderMatch = ((first.gender_score || 0) + (second.gender_score || 0)) / 2;
        const motivationMatch = ((first.motivation_score || 0) + (second.motivation_score || 0)) / 2;

        // Bonus for complementary kanji (different but related meanings)
        const diversityBonus = this.calculateDiversityBonus(first, second);
        const finalScore = pairScore + diversityBonus;

        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestPair = {
            first_kanji: first,
            second_kanji: second,
            total_score: finalScore,
            gender_match: genderMatch,
            motivation_match: motivationMatch
          };
        }
      }
    }

    if (!bestPair) {
      // Fallback: just use top 2 candidates
      bestPair = {
        first_kanji: candidates[0],
        second_kanji: candidates[1],
        total_score: ((candidates[0].total_score || 0) + (candidates[1].total_score || 0)) / 2,
        gender_match: ((candidates[0].gender_score || 0) + (candidates[1].gender_score || 0)) / 2,
        motivation_match: ((candidates[0].motivation_score || 0) + (candidates[1].motivation_score || 0)) / 2
      };
    }

    return bestPair;
  }

  /**
   * Calculate bonus for kanji diversity
   * Prefer pairs with different but complementary affinities
   */
  private calculateDiversityBonus(
    first: KanjiCandidate,
    second: KanjiCandidate
  ): number {
    const motivations = [
      'knowledge_affinity',
      'creative_affinity',
      'belonging_affinity',
      'dominance_affinity',
      'stability_affinity',
      'freedom_affinity'
    ];

    let diversityScore = 0;

    for (const motivation of motivations) {
      const firstAffinity = first[motivation as keyof KanjiCandidate] as number;
      const secondAffinity = second[motivation as keyof KanjiCandidate] as number;

      // Bonus if both have high affinity (reinforcement)
      if (firstAffinity >= 7 && secondAffinity >= 7) {
        diversityScore += 2;
      }
      // Small bonus if one is high and other is medium (complementary)
      else if (
        (firstAffinity >= 7 && secondAffinity >= 5) ||
        (firstAffinity >= 5 && secondAffinity >= 7)
      ) {
        diversityScore += 1;
      }
    }

    return diversityScore;
  }
}