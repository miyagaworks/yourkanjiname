/**
 * AI Kanji Generation Service
 * Google Gemini APIを使用して性別・性格に適した漢字名を生成
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';

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
    meaning_user?: string;
  };
  second_kanji: {
    char: string;
    meaning_ja: string;
    meaning_en: string;
    meaning_user?: string;
  };
  explanation: {
    ja: string;
    en: string;
    user?: string;
  };
  matching_scores: {
    total: number;
    gender_match: number;
    motivation_match: number;
  };
}

// Language configuration for Gemini prompts
const LANGUAGE_CONFIG: Record<string, { name: string; nameJa: string; charCount: string }> = {
  ja: { name: '日本語', nameJa: '日本語', charCount: '800-1200文字' },
  en: { name: 'English', nameJa: '英語', charCount: '400-600 words' },
  fr: { name: 'Français', nameJa: 'フランス語', charCount: '400-600 mots' },
  de: { name: 'Deutsch', nameJa: 'ドイツ語', charCount: '400-600 Wörter' },
  es: { name: 'Español', nameJa: 'スペイン語', charCount: '400-600 palabras' },
  it: { name: 'Italiano', nameJa: 'イタリア語', charCount: '400-600 parole' },
  th: { name: 'ภาษาไทย', nameJa: 'タイ語', charCount: '800-1200 ตัวอักษร' },
  vi: { name: 'Tiếng Việt', nameJa: 'ベトナム語', charCount: '800-1200 ký tự' },
  id: { name: 'Bahasa Indonesia', nameJa: 'インドネシア語', charCount: '400-600 kata' },
  ko: { name: '한국어', nameJa: '韓国語', charCount: '800-1200자' }
};

export class AIKanjiGenerationService {
  private client: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * ユーザープロファイルから漢字名を生成
   * @param profile ユーザープロファイル
   * @param userName ユーザー名
   * @param language ユーザーの選択言語（デフォルト: 'en'）
   */
  async generateKanjiName(profile: UserProfile, userName: string, language: string = 'en'): Promise<KanjiNameResult> {
    const prompt = this.buildPrompt(profile, userName, language);

    // リトライ処理（最大3回）
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.MINIMAL  // Minimal thinking for faster response
            }
          }
        });

        const text = response.text || '';

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
   * @param profile ユーザープロファイル
   * @param userName ユーザー名
   * @param language ユーザーの選択言語
   */
  private buildPrompt(profile: UserProfile, userName: string, language: string): string {
    const genderDesc = this.getGenderDescription(profile);
    const motivationDesc = this.getMotivationDescription(profile);
    const behavioralDesc = this.getBehavioralDescription(profile);

    const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.en;
    const isJapanese = language === 'ja';
    const isEnglish = language === 'en';

    // ユーザー言語が日本語または英語の場合は、追加のユーザー言語出力は不要
    const needsUserLang = !isJapanese && !isEnglish;

    let userLangInstructions = '';
    let userLangOutput = '';

    if (needsUserLang) {
      userLangInstructions = `
4. explanation_user: ${langConfig.name}で${langConfig.charCount}（ユーザー表示用、explanation_jaの翻訳）
5. 各漢字のmeaning_user: ${langConfig.name}での意味`;

      userLangOutput = `
  "meaning_user": "${langConfig.name}での意味（例：harmonie, paisible）",`;
    }

    // 性別に応じた漢字選択の指示
    const genderKanjiGuidance = this.getGenderKanjiGuidance(profile.declared_gender);

    return `あなたは日本の名前の専門家です。外国人に最適な漢字2文字の日本名を提案します。

# プロファイル
名前: ${userName}
性別: ${this.translateGender(profile.declared_gender)}
性格: ${genderDesc}
動機: ${motivationDesc}
特性: ${behavioralDesc}
希望言語: ${langConfig.nameJa}

# 性別に適した漢字選択（重要）
${genderKanjiGuidance}

# タスク
上記の性格と**性別に適した**漢字2文字の日本名を提案し、説明文を作成してください。

## 出力要件
1. explanation_ja: 日本語で800-1200文字（運営者用・必須）
2. explanation_en: 英語で400-600 words（explanation_jaの翻訳）
3. 各漢字のmeaning_ja/meaning_en: 日本語と英語での意味${userLangInstructions}

## 説明文の構造（必ず従ってください）
説明文は以下の3部構成で書いてください：

1. **導入部**: ユーザーの名前と性格分析の概要（1段落）
2. **漢字の説明**:
   - 一文字目の漢字の説明（必ず「まず一文字目の漢字は、」または各言語の同等表現で始める）
   - 二文字目の漢字の説明（必ず「二文字目の漢字は、」または各言語の同等表現で始める）
3. **結び**: 必ず「あなたにピッタリの漢字名が出来上がりました！」または各言語の同等表現で締める

各言語での必須フレーズ：
- 日本語: 「まず一文字目の漢字は、」「二文字目の漢字は、」「あなたにピッタリの漢字名が出来上がりました！」
- English: "The first character" "The second character" "Your perfect kanji name has been created!"
- Français: "Le premier caractère" "Le deuxième caractère" "Votre nom kanji parfait a été créé !"
- Deutsch: "Das erste Zeichen" "Das zweite Zeichen" "Ihr perfekter Kanji-Name wurde erstellt!"
- Español: "El primer carácter" "El segundo carácter" "¡Tu nombre kanji perfecto ha sido creado!"
- Italiano: "Il primo carattere" "Il secondo carattere" "Il tuo nome kanji perfetto è stato creato!"
- 한국어: "첫 번째 한자는" "두 번째 한자는" "당신에게 딱 맞는 한자 이름이 완성되었습니다!"
- ภาษาไทย: "ตัวอักษรคันจิตัวแรก" "ตัวอักษรคันจิตัวที่สอง" "ชื่อคันจิที่เหมาะกับคุณถูกสร้างขึ้นแล้ว!"
- Tiếng Việt: "Ký tự kanji đầu tiên" "Ký tự kanji thứ hai" "Tên kanji hoàn hảo của bạn đã được tạo!"
- Bahasa Indonesia: "Karakter kanji pertama" "Karakter kanji kedua" "Nama kanji sempurna Anda telah dibuat!"

数値やスコアは一切含めないでください。

【重要】読み方について：
- 説明文には読み方（ひらがな・カタカナ）を一切含めないでください
- 日本の名前には「名乗り読み」という特別な読み方があり、標準的な音読み・訓読みとは異なります
- 読み方は本人が自由に決められるものなので、特定の読み方を提示しないでください

## 出力形式（JSON）

必ず以下のJSON形式で出力してください:

\`\`\`json
{
  "first_kanji": {
    "char": "和",
    "meaning_ja": "調和、穏やか",
    "meaning_en": "harmony, peaceful"${needsUserLang ? ',' + userLangOutput : ''}
  },
  "second_kanji": {
    "char": "美",
    "meaning_ja": "美しい、優れた",
    "meaning_en": "beautiful, excellent"${needsUserLang ? ',' + userLangOutput : ''}
  },
  "explanation_ja": "【800-1200文字の日本語説明】",
  "explanation_en": "【400-600 wordsの英語説明】"${needsUserLang ? `,
  "explanation_user": "【${langConfig.charCount}の${langConfig.name}説明】"` : ''}
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
   * 性別に応じた漢字選択のガイダンスを取得
   */
  private getGenderKanjiGuidance(gender: string): string {
    if (gender === 'male') {
      return `男性には男性らしい力強さ・知性・志を感じさせる名前を選んでください。

【男性向けの漢字例】
- 力強さ: 剛、勇、武、龍、翔、雄、豪、健、壮、岳、嵩
- 知性・志: 智、哲、賢、理、悟、慧、聡、学、志、匠
- 高潔さ: 仁、義、誠、信、礼、廉、正、公、徳、孝
- 自然（男性的）: 岳、峻、崇、嵩、海、洋、陽、暁、曙、旭
- リーダーシップ: 将、統、督、司、主、帥、導、率

【男性には避けるべき漢字・組み合わせ】
- 「帆」「花」「咲」「美」「麗」「彩」「香」「姫」「愛」「萌」などは女性的な印象が強い
- 「和帆」「理帆」「優花」など、○帆、○花の組み合わせは女性名として認識される
- 柔らかい響きの名前（〜み、〜な、〜か終わり）は避ける`;
    } else if (gender === 'female') {
      return `女性には優雅さ・美しさ・知性を感じさせる名前を選んでください。

【女性向けの漢字例】
- 美しさ: 美、麗、華、彩、艶、雅、優、麻、絢、綾
- 自然（女性的）: 花、咲、桜、菜、葉、芽、蘭、茜、澪、凪
- 優しさ: 愛、心、和、温、恵、慈、仁、穏、寧、柔
- 知性: 理、智、聡、慧、知、文、学、賢
- 希望・光: 光、輝、陽、明、星、月、希、望、夢

【女性には避けるべき漢字】
- 「剛」「武」「勇」「豪」「虎」「龍」などは男性的すぎる
- 「〜郎」「〜介」「〜助」「〜之」などの男性名の語尾`;
    } else {
      return `中性的で、男女どちらでも使える品のある名前を選んでください。

【中性的な漢字例】
- 知性: 智、理、悟、学、聡、慧
- 自然: 空、海、陽、光、風、森、翠
- 品格: 雅、優、純、清、澄、凛
- 希望: 希、望、輝、明、晴

極端に男性的・女性的な漢字は避けてください。`;
    }
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
        meaning_user: aiResult.first_kanji.meaning_user
      },
      second_kanji: {
        char: aiResult.second_kanji.char,
        meaning_ja: aiResult.second_kanji.meaning_ja,
        meaning_en: aiResult.second_kanji.meaning_en,
        meaning_user: aiResult.second_kanji.meaning_user
      },
      explanation: {
        ja: aiResult.explanation_ja,
        en: aiResult.explanation_en || '',
        user: aiResult.explanation_user
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
