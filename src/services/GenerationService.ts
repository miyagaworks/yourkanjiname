/**
 * Generation Service
 */

import { Pool } from 'pg';
import { DatabaseConfig } from '../config/database';
import { SessionService } from './SessionService';
import { ScoringEngine } from '../scoring';
import { AIKanjiGenerationService } from './AIKanjiGenerationService';

export class GenerationService {
  private pool: Pool;
  private sessionService: SessionService;

  constructor() {
    this.pool = DatabaseConfig.getPool();
    this.sessionService = new SessionService();
  }

  /**
   * Generate kanji name for a session
   * @param sessionId セッションID
   * @param language ユーザーの選択言語（デフォルト: 'en'）
   */
  async generateKanjiName(sessionId: string, language: string = 'en') {
    // Get session
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      const error: any = new Error('Session not found');
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    // Check if already generated
    if (session.completed && session.result_kanji_name) {
      return this.getResult(sessionId);
    }

    // Get all answers
    const answers = await this.sessionService.getAnswers(sessionId);

    // Validate completion
    if (answers.length < 14) {
      const error: any = new Error('Not all questions have been answered');
      error.code = 'INSUFFICIENT_ANSWERS';
      throw error;
    }

    // Calculate scoring
    const scoringResult = ScoringEngine.processAnswers(answers);

    // Save scoring results to database
    await this.saveScoringResults(sessionId, scoringResult);

    // Get user's name
    const userName = await this.getUserName(sessionId);

    // Generate kanji name using AI
    const aiService = new AIKanjiGenerationService();
    const userProfile = {
      declared_gender: scoringResult.gender_profile.declared_gender,
      gender_trait_score: scoringResult.gender_profile.trait_score,
      highest_motivation: scoringResult.highest_motivation,
      motivation_scores: scoringResult.motivation_scores,
      behavioral_traits: scoringResult.behavioral_traits
    };

    const kanjiResult = await aiService.generateKanjiName(userProfile, userName, language);

    // Save result to database (simplified - store AI result)
    await this.saveAIResult(sessionId, kanjiResult, scoringResult);

    // Mark session as completed
    await this.sessionService.completeSession(sessionId, kanjiResult.kanji_name);

    // Format response
    return this.formatAIResult(kanjiResult, scoringResult, userName);
  }

  /**
   * Get existing result
   */
  async getResult(sessionId: string) {
    const query = `
      SELECT *
      FROM naming_results
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [sessionId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      kanji_name: row.kanji_name,
      first_kanji: {
        char: row.first_kanji_char,
        meaning_en: row.first_kanji_meaning_en,
        meaning_ja: row.first_kanji_meaning_ja,
        pronunciation: ''
      },
      second_kanji: {
        char: row.second_kanji_char,
        meaning_en: row.second_kanji_meaning_en,
        meaning_ja: row.second_kanji_meaning_ja,
        pronunciation: ''
      },
      explanation: {
        ja: row.explanation_ja,
        en: row.explanation_en
      },
      matching_scores: {
        total: row.matching_score,
        gender_match: row.gender_match_score,
        motivation_match: row.motivation_match_score,
        subtype_match: row.subtype_match_score || 0
      }
    };
  }

  /**
   * Save scoring results
   */
  private async saveScoringResults(sessionId: string, scoringResult: any) {
    // Save gender profile
    const genderQuery = `
      INSERT INTO gender_profiles (session_id, declared_gender, gender_trait_score)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_id) DO UPDATE
      SET declared_gender = $2, gender_trait_score = $3
    `;
    await this.pool.query(genderQuery, [
      sessionId,
      scoringResult.gender_profile.declared_gender,
      scoringResult.gender_profile.trait_score
    ]);

    // Save motivation scores
    const motivationQuery = `
      INSERT INTO motivation_scores (
        session_id, knowledge_desire, creative_desire, belonging_desire,
        dominance_desire, stability_desire, freedom_desire, highest_motivation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (session_id) DO UPDATE
      SET knowledge_desire = $2, creative_desire = $3, belonging_desire = $4,
          dominance_desire = $5, stability_desire = $6, freedom_desire = $7,
          highest_motivation = $8
    `;
    await this.pool.query(motivationQuery, [
      sessionId,
      scoringResult.motivation_scores.knowledge,
      scoringResult.motivation_scores.creative,
      scoringResult.motivation_scores.belonging,
      scoringResult.motivation_scores.dominance,
      scoringResult.motivation_scores.stability,
      scoringResult.motivation_scores.freedom,
      scoringResult.highest_motivation
    ]);
  }

  /**
   * Get user's full name from session
   */
  private async getUserName(sessionId: string): Promise<string> {
    const query = 'SELECT user_name FROM sessions WHERE session_id = $1';
    const result = await this.pool.query(query, [sessionId]);
    return result.rows[0]?.user_name || 'Unknown';
  }

  /**
   * Save AI-generated result to database
   */
  private async saveAIResult(sessionId: string, kanjiResult: any, scoringResult: any) {
    const query = `
      INSERT INTO naming_results (
        session_id,
        kanji_name,
        first_kanji_char,
        second_kanji_char,
        first_kanji_meaning_ja,
        first_kanji_meaning_en,
        second_kanji_meaning_ja,
        second_kanji_meaning_en,
        matching_score,
        gender_match_score,
        motivation_match_score,
        subtype_match_score,
        explanation_ja,
        explanation_en
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;

    await this.pool.query(query, [
      sessionId,
      kanjiResult.kanji_name,
      kanjiResult.first_kanji.char,
      kanjiResult.second_kanji.char,
      kanjiResult.first_kanji.meaning_ja,
      kanjiResult.first_kanji.meaning_en,
      kanjiResult.second_kanji.meaning_ja,
      kanjiResult.second_kanji.meaning_en,
      Math.round(kanjiResult.matching_scores.total),
      Math.round(kanjiResult.matching_scores.gender_match),
      Math.round(kanjiResult.matching_scores.motivation_match),
      0, // subtype_match_score not calculated separately
      kanjiResult.explanation.ja,
      kanjiResult.explanation.en
    ]);
  }

  /**
   * Format AI result for API response
   */
  private formatAIResult(kanjiResult: any, scoringResult: any, userName: string) {
    return {
      kanji_name: kanjiResult.kanji_name,
      user_name: userName,
      first_kanji: {
        char: kanjiResult.first_kanji.char,
        meaning_en: kanjiResult.first_kanji.meaning_en,
        meaning_ja: kanjiResult.first_kanji.meaning_ja,
        meaning_user: kanjiResult.first_kanji.meaning_user,
        pronunciation: kanjiResult.first_kanji.pronunciation
      },
      second_kanji: {
        char: kanjiResult.second_kanji.char,
        meaning_en: kanjiResult.second_kanji.meaning_en,
        meaning_ja: kanjiResult.second_kanji.meaning_ja,
        meaning_user: kanjiResult.second_kanji.meaning_user,
        pronunciation: kanjiResult.second_kanji.pronunciation
      },
      explanation: {
        ja: kanjiResult.explanation.ja,
        en: kanjiResult.explanation.en,
        user: kanjiResult.explanation.user
      },
      matching_scores: {
        total: Math.round(kanjiResult.matching_scores.total),
        gender_match: Math.round(kanjiResult.matching_scores.gender_match),
        motivation_match: Math.round(kanjiResult.matching_scores.motivation_match),
        subtype_match: 0
      },
      profile: {
        gender: scoringResult.gender_profile.declared_gender,
        gender_trait_score: scoringResult.gender_profile.trait_score,
        highest_motivation: scoringResult.highest_motivation,
        behavioral_traits: scoringResult.behavioral_traits
      }
    };
  }

  /**
   * Save result to database
   */
  private async saveResult(sessionId: string, kanjiPair: any, scoringResult: any) {
    const kanjiName = kanjiPair.first_kanji.kanji_char + kanjiPair.second_kanji.kanji_char;

    // Generate explanation
    const explanationJa = this.generateExplanation(kanjiPair, scoringResult, 'ja');
    const explanationEn = this.generateExplanation(kanjiPair, scoringResult, 'en');

    const query = `
      INSERT INTO naming_results (
        session_id,
        kanji_name,
        first_kanji_id,
        second_kanji_id,
        matching_score,
        gender_match_score,
        motivation_match_score,
        subtype_match_score,
        explanation_ja,
        explanation_en
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await this.pool.query(query, [
      sessionId,
      kanjiName,
      kanjiPair.first_kanji.kanji_id,
      kanjiPair.second_kanji.kanji_id,
      Math.round(kanjiPair.total_score),
      Math.round(kanjiPair.gender_match),
      Math.round(kanjiPair.motivation_match),
      0, // subtype_match_score (not calculated separately anymore)
      explanationJa,
      explanationEn
    ]);
  }

  /**
   * Format result for API response (new version)
   */
  private formatNewResult(kanjiPair: any, scoringResult: any) {
    const kanjiName = kanjiPair.first_kanji.kanji_char + kanjiPair.second_kanji.kanji_char;

    return {
      kanji_name: kanjiName,
      first_kanji: {
        char: kanjiPair.first_kanji.kanji_char,
        meaning_en: kanjiPair.first_kanji.meaning_en,
        meaning_ja: kanjiPair.first_kanji.meaning_ja,
        pronunciation_on: [],
        pronunciation_kun: []
      },
      second_kanji: {
        char: kanjiPair.second_kanji.kanji_char,
        meaning_en: kanjiPair.second_kanji.meaning_en,
        meaning_ja: kanjiPair.second_kanji.meaning_ja,
        pronunciation_on: [],
        pronunciation_kun: []
      },
      explanation: {
        ja: this.generateExplanation(kanjiPair, scoringResult, 'ja'),
        en: this.generateExplanation(kanjiPair, scoringResult, 'en')
      },
      matching_scores: {
        total: Math.round(kanjiPair.total_score),
        gender_match: Math.round(kanjiPair.gender_match),
        motivation_match: Math.round(kanjiPair.motivation_match),
        subtype_match: 0
      },
      pronunciation: {
        romaji: this.generateRomaji(kanjiName),
        hiragana: this.generateHiragana(kanjiName)
      }
    };
  }

  /**
   * Generate detailed personality analysis (800-1200 characters)
   */
  private generateExplanation(kanjiPair: any, scoringResult: any, lang: 'ja' | 'en'): string {
    const motivation = scoringResult.highest_motivation;
    const genderTrait = scoringResult.gender_profile.trait_score;

    const firstMeaning = lang === 'ja' ? kanjiPair.first_kanji.meaning_ja : kanjiPair.first_kanji.meaning_en;
    const secondMeaning = lang === 'ja' ? kanjiPair.second_kanji.meaning_ja : kanjiPair.second_kanji.meaning_en;

    // Personality traits based on motivation (flat structure, no subtypes)
    const personalityDescriptions: Record<string, {ja: string, en: string}> = {
      knowledge: {
        ja: '学びと理解を追求し、物事の本質を探求するあなた',
        en: 'You pursue learning and understanding, exploring the essence of things'
      },
      creative: {
        ja: '新しいものを創り出し、独自の表現を追求するあなた',
        en: 'You create new things and pursue your own unique expression'
      },
      belonging: {
        ja: '深い愛情で人と繋がり、かけがえのない絆を大切にするあなた',
        en: 'You connect with people through deep affection and cherish irreplaceable bonds'
      },
      dominance: {
        ja: 'リーダーシップを発揮し、人々を導くことに使命を感じるあなた',
        en: 'You feel a mission in exercising leadership and guiding people'
      },
      stability: {
        ja: '心の平穏と安らぎを何よりも大切にするあなた',
        en: 'You value peace of mind and tranquility above all else'
      },
      freedom: {
        ja: '束縛を嫌い、完全な独立と自由を求めるあなた',
        en: 'You dislike constraints and seek complete independence and freedom'
      }
    };

    const personalityDesc = personalityDescriptions[motivation] ||
      (lang === 'ja' ? {ja: 'あなた', en: 'You'} : {ja: 'あなた', en: 'You'});

    // Gender trait description
    let genderDesc = '';
    if (lang === 'ja') {
      if (Math.abs(genderTrait) <= 2) {
        genderDesc = 'バランスの取れた柔軟な視点を持ち、';
      } else if (genderTrait > 2) {
        genderDesc = '決断力と行動力を兼ね備え、';
      } else {
        genderDesc = '共感力と繊細な感性を持ち、';
      }
    } else {
      if (Math.abs(genderTrait) <= 2) {
        genderDesc = 'With a balanced and flexible perspective, ';
      } else if (genderTrait > 2) {
        genderDesc = 'Combining decisiveness and action, ';
      } else {
        genderDesc = 'With empathy and delicate sensibility, ';
      }
    }

    // Get second highest motivation for complexity analysis
    const motivationScores = scoringResult.motivation_scores;
    const sortedMotivations = Object.entries(motivationScores)
      .sort(([,a], [,b]) => (b as number) - (a as number));
    const secondMotivation = sortedMotivations[1]?.[0] || '';
    const secondScore = sortedMotivations[1]?.[1] || 0;

    if (lang === 'ja') {
      return this.generateJapaneseAnalysis(
        genderDesc,
        personalityDesc.ja,
        motivation,
        secondMotivation,
        secondScore as number,
        genderTrait,
        kanjiPair,
        firstMeaning,
        secondMeaning
      );
    } else {
      return this.generateEnglishAnalysis(
        genderDesc,
        personalityDesc.en,
        motivation,
        secondMotivation,
        secondScore as number,
        genderTrait,
        kanjiPair,
        firstMeaning,
        secondMeaning
      );
    }
  }

  /**
   * Generate detailed Japanese personality analysis
   */
  private generateJapaneseAnalysis(
    genderDesc: string,
    personalityCore: string,
    mainMotivation: string,
    secondMotivation: string,
    secondScore: number,
    genderTrait: number,
    kanjiPair: any,
    firstMeaning: string,
    secondMeaning: string
  ): string {
    // Paragraph 1: Core personality
    const para1 = `${genderDesc}${personalityCore}。あなたの人生において最も大切にしているのは、${this.getMotivationEssence(mainMotivation)}です。この価値観は、あなたが日々下す選択や、困難に直面したときの判断基準となっています。`;

    // Paragraph 2: Inner complexity
    let para2 = '';
    if (secondScore >= 5) {
      para2 = `同時に、あなたの内面には${this.getMotivationEssence(secondMotivation)}という もう一つの重要な側面があります。これは時に${this.getMotivationEssence(mainMotivation)}と緊張関係を生むこともありますが、この二つの価値観が調和することで、あなたは単純化できない豊かな人格を形成しています。この内なる複雑さこそが、あなたの深みと魅力の源となっているのです。`;
    } else {
      para2 = `あなたの性格は一貫性が高く、${this.getMotivationEssence(mainMotivation)}という核となる価値観にブレがありません。この明確さは、周囲の人々にとって信頼と安心感の源となり、あなた自身にとっても人生の指針となっています。`;
    }

    // Paragraph 3: Interpersonal style
    const para3 = this.getInterpersonalStyle(genderTrait, mainMotivation);

    // Paragraph 4: Growth and future with kanji meaning
    const para4 = `「${kanjiPair.first_kanji.kanji_char}」と「${kanjiPair.second_kanji.kanji_char}」。この二つの漢字があなたの名前として選ばれたのは偶然ではありません。${firstMeaning}を表す「${kanjiPair.first_kanji.kanji_char}」は、あなたの${this.getKanjiConnection(mainMotivation, 'first')}を、${secondMeaning}を意味する「${kanjiPair.second_kanji.kanji_char}」は、あなたの${this.getKanjiConnection(mainMotivation, 'second')}を象徴しています。これらの漢字は、あなたがこれから歩む人生の道筋を照らす灯りとなるでしょう。`;

    // Closing
    const closing = `\n\nあなたにピッタリの漢字名が出来上がりました！これを今日からあなたの日本語名としてお使いください。`;

    return para1 + '\n\n' + para2 + '\n\n' + para3 + '\n\n' + para4 + closing;
  }

  /**
   * Generate detailed English personality analysis
   */
  private generateEnglishAnalysis(
    genderDesc: string,
    personalityCore: string,
    mainMotivation: string,
    secondMotivation: string,
    secondScore: number,
    genderTrait: number,
    kanjiPair: any,
    firstMeaning: string,
    secondMeaning: string
  ): string {
    const para1 = `${genderDesc}${personalityCore}. What matters most in your life is ${this.getMotivationEssenceEn(mainMotivation)}. This core value serves as the foundation for your daily choices and becomes your compass when facing challenges.`;

    let para2 = '';
    if (secondScore >= 5) {
      para2 = `At the same time, your inner world holds another important aspect: ${this.getMotivationEssenceEn(secondMotivation)}. While this sometimes creates tension with ${this.getMotivationEssenceEn(mainMotivation)}, the harmony between these two values forms a rich personality that cannot be simplified. This inner complexity is the very source of your depth and charm.`;
    } else {
      para2 = `Your personality shows remarkable consistency, with unwavering commitment to ${this.getMotivationEssenceEn(mainMotivation)}. This clarity becomes a source of trust and reassurance for those around you, while serving as your life's guiding principle.`;
    }

    const para3 = this.getInterpersonalStyleEn(genderTrait, mainMotivation);

    const para4 = `"${kanjiPair.first_kanji.kanji_char}" and "${kanjiPair.second_kanji.kanji_char}". It is no coincidence that these two kanji were chosen as your name. "${kanjiPair.first_kanji.kanji_char}" representing ${firstMeaning} symbolizes your ${this.getKanjiConnectionEn(mainMotivation, 'first')}, while "${kanjiPair.second_kanji.kanji_char}" meaning ${secondMeaning} embodies your ${this.getKanjiConnectionEn(mainMotivation, 'second')}. These characters will serve as beacons illuminating the path of your life journey ahead.`;

    const closing = `\n\nThis name is perfect for you. Please use it as your Japanese name from today.`;

    return para1 + '\n\n' + para2 + '\n\n' + para3 + '\n\n' + para4 + closing;
  }

  private getMotivationEssence(motivation: string): string {
    const essences: Record<string, string> = {
      knowledge: '知ること、理解すること、真理を探究すること',
      creative: '創造すること、新しいものを生み出すこと、自己表現すること',
      belonging: '繋がること、愛し愛されること、共に在ること',
      dominance: '影響を与えること、リードすること、卓越すること',
      stability: '守ること、安定を保つこと、揺るぎない基盤を築くこと',
      freedom: '自由であること、制約なく生きること、自分らしくあること'
    };
    return essences[motivation] || '自己実現';
  }

  private getMotivationEssenceEn(motivation: string): string {
    const essences: Record<string, string> = {
      knowledge: 'knowing, understanding, and pursuing truth',
      creative: 'creating, bringing forth new things, and expressing yourself',
      belonging: 'connecting, loving and being loved, and being together',
      dominance: 'influencing, leading, and excelling',
      stability: 'protecting, maintaining stability, and building an unwavering foundation',
      freedom: 'being free, living without constraints, and being yourself'
    };
    return essences[motivation] || 'self-actualization';
  }

  private getInterpersonalStyle(genderTrait: number, motivation: string): string {
    let base = '';
    if (motivation === 'belonging') {
      base = '人間関係において、あなたは深い繋がりと相互理解を大切にします。表面的な付き合いよりも、心から信頼できる関係性を築くことに時間とエネルギーを注ぎます。';
    } else if (motivation === 'dominance') {
      base = '集団の中では、自然とリーダーシップを発揮する立場に立つことが多いでしょう。あなたの存在は、周囲の人々に方向性と活力を与えます。';
    } else if (motivation === 'freedom') {
      base = '人間関係においても、相手の自由と個性を尊重することを重んじます。束縛や依存を避け、互いに独立した関係性を好みます。';
    } else {
      base = 'あなたは自分の内なる世界を大切にしながらも、周囲との調和を保つバランス感覚を持っています。';
    }

    let genderAdd = '';
    if (genderTrait > 3) {
      genderAdd = '明確な意思表示と論理的なコミュニケーションを好み、効率的に物事を進めることを得意とします。';
    } else if (genderTrait < -3) {
      genderAdd = '相手の感情や状況に敏感に反応し、共感的なコミュニケーションを通じて関係を深めていきます。';
    } else {
      genderAdd = '状況に応じて、論理と感情のバランスを取りながら、柔軟にコミュニケーションスタイルを調整できます。';
    }

    return base + genderAdd;
  }

  private getInterpersonalStyleEn(genderTrait: number, motivation: string): string {
    let base = '';
    if (motivation === 'belonging') {
      base = 'In relationships, you value deep connections and mutual understanding. You invest time and energy in building genuinely trustworthy relationships rather than superficial acquaintances.';
    } else if (motivation === 'dominance') {
      base = 'In groups, you naturally assume leadership positions. Your presence provides direction and vitality to those around you.';
    } else if (motivation === 'freedom') {
      base = 'Even in relationships, you highly value respecting others\' freedom and individuality. You prefer independent relationships, avoiding constraint and dependence.';
    } else {
      base = 'While cherishing your inner world, you possess a sense of balance that maintains harmony with your surroundings.';
    }

    let genderAdd = '';
    if (genderTrait > 3) {
      genderAdd = ' You prefer clear expression of intentions and logical communication, excelling at moving things forward efficiently.';
    } else if (genderTrait < -3) {
      genderAdd = ' You sensitively respond to others\' emotions and situations, deepening relationships through empathetic communication.';
    } else {
      genderAdd = ' You can flexibly adjust your communication style, balancing logic and emotion according to the situation.';
    }

    return base + genderAdd;
  }

  private getKanjiConnection(motivation: string, position: 'first' | 'second'): string {
    const connections: Record<string, {first: string, second: string}> = {
      knowledge: {first: '探究心と知的好奇心', second: '深い洞察力と理解力'},
      creative: {first: '独創性と創造への情熱', second: '表現力と美的センス'},
      belonging: {first: '他者への共感と思いやり', second: '深い絆を育む力'},
      dominance: {first: 'リーダーシップと影響力', second: '目標達成への強い意志'},
      stability: {first: '揺るぎない信念', second: '守り抜く強さ'},
      freedom: {first: '自由への渇望', second: '独立心と冒険心'}
    };
    return connections[motivation]?.[position] || '内なる強さ';
  }

  private getKanjiConnectionEn(motivation: string, position: 'first' | 'second'): string {
    const connections: Record<string, {first: string, second: string}> = {
      knowledge: {first: 'curiosity and intellectual pursuit', second: 'deep insight and understanding'},
      creative: {first: 'originality and passion for creation', second: 'expressiveness and aesthetic sense'},
      belonging: {first: 'empathy and compassion for others', second: 'ability to nurture deep bonds'},
      dominance: {first: 'leadership and influence', second: 'strong will for achievement'},
      stability: {first: 'unwavering beliefs', second: 'strength to protect'},
      freedom: {first: 'thirst for freedom', second: 'independence and adventurous spirit'}
    };
    return connections[motivation]?.[position] || 'inner strength';
  }

  /**
   * Generate romaji pronunciation (placeholder)
   */
  private generateRomaji(kanji: string): string {
    // TODO: Implement proper romaji generation
    return 'Romaji';
  }

  /**
   * Generate hiragana pronunciation (placeholder)
   */
  private generateHiragana(kanji: string): string {
    // TODO: Implement proper hiragana generation
    return 'ひらがな';
  }
}