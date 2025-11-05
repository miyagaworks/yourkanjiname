"use strict";
// src/services/KanjiMatchingService.ts
// Service for matching user profiles to appropriate kanji
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanjiMatchingService = void 0;
class KanjiMatchingService {
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Find the best kanji pair for a user profile
     */
    async findBestKanjiPair(profile) {
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
    async getAllKanji() {
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
    scoreAllKanji(kanji, profile) {
        return kanji.map(k => {
            // Gender score (30%)
            const genderScore = this.calculateGenderScore(k.masculinity_score, profile.gender_trait_score);
            // Motivation score (70%)
            const motivationScore = this.calculateMotivationScore(k, profile);
            // Total score
            const totalScore = genderScore * KanjiMatchingService.GENDER_WEIGHT +
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
    calculateGenderScore(kanjiMasculinity, userGenderTrait) {
        // Both scores are on -10 to +10 scale
        // Perfect match = 100, opposite = 0
        const difference = Math.abs(kanjiMasculinity - userGenderTrait);
        const maxDifference = 20;
        return 100 * (1 - difference / maxDifference);
    }
    /**
     * Calculate motivation matching score (0-100)
     */
    calculateMotivationScore(kanji, profile) {
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
            const userScore = profile.motivation_scores[motivation];
            const kanjiAffinity = kanji[`${motivation}_affinity`];
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
    findBestPair(candidates, profile) {
        let bestPair = null;
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
    calculateDiversityBonus(first, second) {
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
            const firstAffinity = first[motivation];
            const secondAffinity = second[motivation];
            // Bonus if both have high affinity (reinforcement)
            if (firstAffinity >= 7 && secondAffinity >= 7) {
                diversityScore += 2;
            }
            // Small bonus if one is high and other is medium (complementary)
            else if ((firstAffinity >= 7 && secondAffinity >= 5) ||
                (firstAffinity >= 5 && secondAffinity >= 7)) {
                diversityScore += 1;
            }
        }
        return diversityScore;
    }
}
exports.KanjiMatchingService = KanjiMatchingService;
// Scoring weights
KanjiMatchingService.GENDER_WEIGHT = 0.3;
KanjiMatchingService.MOTIVATION_WEIGHT = 0.7;
