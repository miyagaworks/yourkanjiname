/**
 * AI Kanji Generation Service
 * Google Gemini APIを使用して性別・性格に適した漢字名を生成
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface UserProfile {
  declared_gender: 'male' | 'female' | 'nonbinary' | 'prefer_not_to_say';
  gender_trait_score: number;
  highest_motivation: string;
  second_motivation?: string;
  second_motivation_score?: number;
  motivation_scores: {
    knowledge: number;
    creative: number;
    belonging: number;
    dominance: number;
    stability: number;
    freedom: number;
  };
  behavioral_traits: {
    decisiveness: number;
    action_oriented: number;
    consistency: number;
  };
}

interface KanjiNameResult {
  kanji_name: string;
  first_kanji: {
    char: string;
    meaning_ja: string;
    meaning_en: string;
    pronunciation: string;
  };
  second_kanji: {
    char: string;
    meaning_ja: string;
    meaning_en: string;
    pronunciation: string;
  };
  explanation: {
    ja: string;
    en: string;
  };
  matching_scores: {
    total: number;
    gender_match: number;
    motivation_match: number;
  };
}

export class AIKanjiGenerationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
  }

  /**
   * ユーザープロファイルから漢字名を生成
   */
  async generateKanjiName(profile: UserProfile, userName: string): Promise<KanjiNameResult> {
    const prompt = this.buildPrompt(profile, userName);

    // リトライ処理（最大3回）
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 成功したらパース処理へ
        return this.parseResponse(text, profile);
      } catch (error: any) {
        lastError = error;
        console.log(`Gemini API attempt ${attempt} failed:`, error.message);

        // 503エラー（サービス過負荷）の場合は待機してリトライ
        if (error.status === 503 && attempt < 3) {
          const waitTime = attempt * 5000; // 5秒, 10秒
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // その他のエラーまたは最終試行の場合は投げる
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * AIレスポンスをパース
   */
  private parseResponse(text: string, profile: UserProfile): KanjiNameResult {

    // JSONを抽出（マークダウンコードブロックから）
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response: ' + text);
    }

    let jsonText = jsonMatch[1] || jsonMatch[0];

    // JSON文字列値の中の制御文字のみをエスケープ（構造的な改行は保持）
    jsonText = this.sanitizeJsonString(jsonText);

    const aiResult = JSON.parse(jsonText);

    return this.formatResult(aiResult, profile);
  }

  /**
   * JSON文字列値内の制御文字をエスケープ
   */
  private sanitizeJsonString(jsonText: string): string {
    let result = '';
    let inString = false;
    let escaped = false;

    for (let i = 0; i < jsonText.length; i++) {
      const char = jsonText[i];

      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\' && inString) {
        result += char;
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        result += char;
        continue;
      }

      // 文字列内の制御文字をエスケープ
      if (inString && char.charCodeAt(0) < 32) {
        if (char === '\n') result += '\\n';
        else if (char === '\r') result += '\\r';
        else if (char === '\t') result += '\\t';
        continue;
      }

      result += char;
    }

    return result;
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(profile: UserProfile, userName: string): string {
    const genderDesc = this.getGenderDescription(profile);
    const motivationDesc = this.getMotivationDescription(profile);
    const behavioralDesc = this.getBehavioralDescription(profile);
    const secondMotivation = this.getSecondMotivation(profile);

    return `あなたは日本の名前の専門家です。外国人に最適な漢字2文字の日本名を提案します。

# プロファイル
名前: ${userName}
性別: ${this.translateGender(profile.declared_gender)}
性格: ${genderDesc}
動機: ${motivationDesc}
特性: ${behavioralDesc}

# タスク
上記の性格に合った漢字2文字の日本名を提案し、800-1200文字の日本語で詳細に説明してください。
説明は2段落構成で、最後に「あなたにピッタリの漢字名が出来上がりました！」で締めてください。数値やスコアは一切含めないでください。
英語説明は日本語の完全な翻訳としてください。

## 出力形式（JSON）

必ず以下のJSON形式で出力してください:

\`\`\`json
{
  "first_kanji": {
    "char": "和",
    "meaning_ja": "調和、穏やか",
    "meaning_en": "harmony, peaceful",
    "pronunciation": "わ"
  },
  "second_kanji": {
    "char": "美",
    "meaning_ja": "美しい、優れた",
    "meaning_en": "beautiful, excellent",
    "pronunciation": "み"
  },
  "explanation_ja": "【ここに800-1200文字の詳細な性格分析を記述】",
  "explanation_en": "【explanation_jaの完全な英語翻訳】"
}
\`\`\``;
  }

  /**
   * 性別の説明を取得
   */
  private getGenderDescription(profile: UserProfile): string {
    const score = profile.gender_trait_score;
    let desc = '';

    if (profile.declared_gender === 'male') {
      if (score >= 6) desc = 'リーダーシップ、競争心、決断力が強い';
      else if (score >= 1) desc = '協調性と穏やかさを持つ';
      else desc = '共感力と協調性が豊か';
    } else if (profile.declared_gender === 'female') {
      if (score >= 6) desc = '共感力、美的感覚、育む力が豊か';
      else if (score >= 1) desc = '独立心と女性性のバランスが取れている';
      else desc = '論理性と独立性が高い';
    } else {
      if (score >= 6) desc = '力強さと決断力がある';
      else if (score >= -5) desc = 'バランスの取れた性質';
      else desc = '柔軟性と共感力が豊か';
    }

    return desc;
  }

  /**
   * 動機の説明を取得
   */
  private getMotivationDescription(profile: UserProfile): string {
    const motivationNames: Record<string, string> = {
      knowledge: '知識欲（学び、理解、真理探究）',
      creative: '創造欲（創作、表現、革新）',
      belonging: '所属欲（愛、繋がり、調和）',
      dominance: '支配欲（リーダーシップ、達成、影響力）',
      stability: '安定欲（平穏、継続、信念）',
      freedom: '自由欲（独立、冒険、個性）'
    };
    return motivationNames[profile.highest_motivation] || profile.highest_motivation;
  }

  /**
   * 第2動機を取得
   */
  private getSecondMotivation(profile: UserProfile): string {
    const scores = { ...profile.motivation_scores };
    delete (scores as any)[profile.highest_motivation];

    let secondMotivation = '';
    let secondScore = 0;

    for (const [motivation, score] of Object.entries(scores)) {
      if (score > secondScore) {
        secondMotivation = motivation;
        secondScore = score;
      }
    }

    const motivationNames: Record<string, string> = {
      knowledge: '知識欲',
      creative: '創造欲',
      belonging: '所属欲',
      dominance: '支配欲',
      stability: '安定欲',
      freedom: '自由欲'
    };

    return motivationNames[secondMotivation] || secondMotivation;
  }

  /**
   * 行動特性の説明を取得
   */
  private getBehavioralDescription(profile: UserProfile): string {
    const { decisiveness, action_oriented, consistency } = profile.behavioral_traits;

    let traits = [];

    if (decisiveness >= 4) traits.push('即決できる');
    else if (decisiveness >= 0) traits.push('慎重に考える');
    else if (decisiveness >= -2) traits.push('じっくり考える');
    else traits.push('相談しながら決める');

    if (action_oriented >= 2) traits.push('行動的');
    else if (action_oriented >= 0) traits.push('計画的');
    else traits.push('慎重');

    if (consistency >= 2) traits.push('一貫性がある');
    else if (consistency >= 0) traits.push('適度に柔軟');
    else traits.push('柔軟性が高い');

    return traits.join('、');
  }

  /**
   * 性別を日本語に翻訳
   */
  private translateGender(gender: string): string {
    const translations: Record<string, string> = {
      male: '男性',
      female: '女性',
      nonbinary: 'ノンバイナリー',
      prefer_not_to_say: '回答なし'
    };
    return translations[gender] || gender;
  }


  /**
   * AIの結果をフォーマット
   */
  private formatResult(aiResult: any, profile: UserProfile): KanjiNameResult {
    // マッチングスコアを計算
    const genderMatch = this.calculateGenderMatch(aiResult, profile);
    const motivationMatch = this.calculateMotivationMatch(aiResult, profile);
    const total = Math.round(genderMatch * 0.3 + motivationMatch * 0.7);

    return {
      kanji_name: aiResult.first_kanji.char + aiResult.second_kanji.char,
      first_kanji: {
        char: aiResult.first_kanji.char,
        meaning_ja: aiResult.first_kanji.meaning_ja,
        meaning_en: aiResult.first_kanji.meaning_en,
        pronunciation: aiResult.first_kanji.pronunciation
      },
      second_kanji: {
        char: aiResult.second_kanji.char,
        meaning_ja: aiResult.second_kanji.meaning_ja,
        meaning_en: aiResult.second_kanji.meaning_en,
        pronunciation: aiResult.second_kanji.pronunciation
      },
      explanation: {
        ja: aiResult.explanation_ja,
        en: aiResult.explanation_en || ''
      },
      matching_scores: {
        total,
        gender_match: genderMatch,
        motivation_match: motivationMatch
      }
    };
  }

  /**
   * 性別マッチスコアを計算（簡易版）
   */
  private calculateGenderMatch(aiResult: any, profile: UserProfile): number {
    // AIが適切な漢字を選んでいると仮定して高スコアを返す
    return 90;
  }

  /**
   * 動機マッチスコアを計算（簡易版）
   */
  private calculateMotivationMatch(aiResult: any, profile: UserProfile): number {
    // AIが動機に合った漢字を選んでいると仮定
    return 95;
  }
}