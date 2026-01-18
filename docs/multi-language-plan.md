# 多言語対応システム 計画書

## 概要

訪日外国人向けに、スマートフォンの言語設定に基づいて自動的に適切な言語で表示し、質問から漢字名の説明、メール通知まで一貫した多言語体験を提供する。

---

## 1. 対応言語

### 言語選択UIの表示順序（上から下）

**2023年広島県外国人観光客数に基づく。** 韓国語と日本語は固定位置。

広島県は平和記念資料館の影響で欧米豪圏からの来訪者が多い（全体の56.2%）という特徴がある。

| 表示順 | 言語 | コード | 広島来訪者数(2023) | 備考 |
|--------|------|--------|-------------------|------|
| 1 | 英語 | en | 約60万人+ | 米国(36.9万)、豪州(24万)、英国、カナダ等 |
| 2 | フランス語 | fr | 順位大幅上昇 | 欧州主要国、G7効果 |
| 3 | ドイツ語 | de | 順位大幅上昇 | 欧州主要国 |
| 4 | スペイン語 | es | 順位大幅上昇 | スペイン、中南米 |
| 5 | イタリア語 | it | 順位大幅上昇 | イタリア |
| 6 | タイ語 | th | アジア圏 | アジア主要国の一つ |
| 7 | ベトナム語 | vi | アジア圏 | アジア主要国の一つ |
| 8 | インドネシア語 | id | アジア圏 | アジア主要国の一つ |
| 9 | 韓国語 | ko | アジア圏 | 韓国（固定位置：日本語の上）|
| 10 | 日本語 | ja | - | 日本在住者（固定位置：最下部）|

**対応言語数: 10言語**

**除外:** 中国語（簡体字・繁体字）- 既に漢字名を持つため

### 広島県の特徴
- 欧米豪主要国: 56.2%（全国平均より大幅に高い）
- アジア主要国: 18.9%（全国平均より低い）
- 平和記念資料館・原爆ドームへの関心が高い
- 2023年はスペイン、イタリア、フランス、カナダ等の順位が大幅上昇

### データソース
- [広島県観光客数の動向（令和5年）](https://www.pref.hiroshima.lg.jp/soshiki/78/r5kankoukyakusunodoko.html)
- [Dive! Hiroshima 観光統計](https://dive-hiroshima.com/business/data/)

---

## 2. 言語検出・切り替えロジック

### 2.1 自動検出（初回アクセス時）

```javascript
// 優先順位
// 1. URLパラメータ (?lang=ko)
// 2. localStorage (過去の選択)
// 3. navigator.language (ブラウザ/OS設定)
// 4. デフォルト: 英語

const detectLanguage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('lang');
  if (urlLang && SUPPORTED_LANGUAGES.includes(urlLang)) return urlLang;

  const savedLang = localStorage.getItem('preferred_language');
  if (savedLang && SUPPORTED_LANGUAGES.includes(savedLang)) return savedLang;

  const browserLang = navigator.language.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(browserLang)) return browserLang;

  return 'en'; // デフォルト
};
```

### 2.2 言語切り替えUI

**現状:** 右上の「EN / 日本語」トグルボタン

**変更後:** ドロップダウンメニュー
- 位置: 右上固定
- 表示: 国旗アイコン + 言語名（その言語で表示）

```
┌─────────────────┐
│ 🇺🇸 English  ▼  │
├─────────────────┤
│ 🇺🇸 English     │  ← 1位: 英語圏（米国・豪州・英国等）
│ 🇫🇷 Français    │  ← 2位: フランス
│ 🇩🇪 Deutsch     │  ← 3位: ドイツ
│ 🇪🇸 Español     │  ← 4位: スペイン
│ 🇮🇹 Italiano    │  ← 5位: イタリア
│ 🇹🇭 ภาษาไทย    │  ← 6位: タイ
│ 🇻🇳 Tiếng Việt  │  ← 7位: ベトナム
│ 🇮🇩 Indonesia   │  ← 8位: インドネシア
│ 🇰🇷 한국어      │  ← 固定: 日本語の上
│ 🇯🇵 日本語      │  ← 固定: 最下部
└─────────────────┘
```

---

## 3. 翻訳対象と管理方法

### 3.1 静的コンテンツ（JSONファイルで管理）

| 項目 | ファイル | 内容 |
|------|----------|------|
| UI文言 | `locales/{lang}/ui.json` | ボタン、ラベル、エラーメッセージ等 |
| 質問文 | `locales/{lang}/questions.json` | 16問の質問と選択肢 |
| 共通説明 | `locales/{lang}/common.json` | ヘッダー、フッター、説明文 |

**ディレクトリ構造:**
```
frontend/src/locales/
├── ja/
│   ├── ui.json
│   ├── questions.json
│   └── common.json
├── en/
│   ├── ui.json
│   ├── questions.json
│   └── common.json
├── ko/
│   └── ...
└── index.js  // 言語ファイルのエクスポート
```

### 3.2 動的コンテンツ（Gemini APIで生成）

| 項目 | 生成方法 |
|------|----------|
| 漢字名の説明文 | プロンプトに言語指定を追加 |
| 各漢字の意味 | 選択言語で出力 |

**プロンプト修正例:**
```
出力言語: ${languageName}
説明文は800-1200文字で${languageName}で記述してください。
```

### 3.3 メールコンテンツ

| 宛先 | 言語 | 内容 |
|------|------|------|
| ユーザー | ユーザーの選択言語 | 書道作品の案内、漢字名の説明 |
| 運営者 | 日本語固定 | 申込者情報、漢字名、説明文（日本語） |

---

## 4. システム構成

### 4.1 フロントエンド変更

```
src/
├── App.js                    // 言語Context追加
├── contexts/
│   └── LanguageContext.js    // 言語状態管理
├── components/
│   └── LanguageSelector.js   // 言語選択UI
├── locales/                  // 翻訳ファイル（10言語）
│   ├── ja/
│   ├── en/
│   ├── fr/
│   ├── de/
│   ├── es/
│   ├── it/
│   ├── th/
│   ├── vi/
│   ├── id/
│   ├── ko/
│   └── index.js
└── hooks/
    └── useTranslation.js     // 翻訳ヘルパー
```

### 4.2 バックエンド変更

```
src/
├── services/
│   ├── AIKanjiGenerationService.ts  // 多言語プロンプト対応
│   └── EmailService.ts              // 多言語メール送信
├── templates/
│   └── emails/
│       ├── user/                    // ユーザー向け（各言語）
│       │   ├── ja.html
│       │   ├── en.html
│       │   └── ...
│       └── admin/                   // 運営者向け（日本語のみ）
│           └── notification.html
└── routes/
    └── calligrapher.ts              // 書道家申込API
```

---

## 5. API設計

### 5.1 書道家申込エンドポイント

```
POST /api/calligrapher-request

Request:
{
  "email": "user@example.com",
  "kanji_name": "理帆",
  "user_name": "John Smith",
  "language": "en",
  "explanation_ja": "（日本語説明文）",
  "explanation_user_lang": "（ユーザー言語の説明文）"
}

Response:
{
  "success": true,
  "message": "Request submitted successfully"
}
```

### 5.2 メール送信フロー

```
申込 → API受信
         ├── ユーザーへメール送信（選択言語）
         │     - 件名: Your Kanji Calligraphy Request
         │     - 内容: 申込確認、書道作品について
         │
         └── 運営者へメール送信（日本語）
               - 件名: 【書道申込】John Smith様 - 理帆
               - 内容:
                 - 申込者名: John Smith
                 - メール: user@example.com
                 - 漢字名: 理帆
                 - 説明文（日本語版）
```

---

## 6. Gemini API プロンプト修正

### 6.1 現在のプロンプト構造

```
あなたは日本の名前の専門家です...
説明は800-1200文字の日本語で...
英語説明は日本語の完全な翻訳として...
```

### 6.2 修正後のプロンプト構造

```javascript
const buildPrompt = (profile, userName, language) => {
  const langConfig = {
    ja: { name: '日本語', charCount: '800-1200文字' },
    en: { name: 'English', charCount: '400-600 words' },
    fr: { name: 'Français', charCount: '400-600 mots' },
    de: { name: 'Deutsch', charCount: '400-600 Wörter' },
    es: { name: 'Español', charCount: '400-600 palabras' },
    it: { name: 'Italiano', charCount: '400-600 parole' },
    th: { name: 'ภาษาไทย', charCount: '800-1200 ตัวอักษร' },
    vi: { name: 'Tiếng Việt', charCount: '800-1200 ký tự' },
    id: { name: 'Bahasa Indonesia', charCount: '400-600 kata' },
    ko: { name: '한국어', charCount: '800-1200자' }
  };

  return `あなたは日本の名前の専門家です...

# 出力要件
1. explanation_ja: 日本語で800-1200文字（運営者用・必須）
2. explanation_user: ${langConfig[language].name}で${langConfig[language].charCount}（ユーザー表示用）
3. 各漢字の意味: 日本語と${langConfig[language].name}の両方

## 出力形式（JSON）
{
  "first_kanji": {
    "char": "和",
    "meaning_ja": "調和、穏やか",
    "meaning_user": "${langConfig[language].name}での意味",
    "pronunciation": "わ"
  },
  ...
  "explanation_ja": "【日本語説明文】",
  "explanation_user": "【${langConfig[language].name}説明文】"
}`;
};
```

---

## 7. 実装フェーズ

### Phase 1: 基盤構築（優先）
- [ ] 言語Context・フック作成
- [ ] 言語選択UIコンポーネント
- [ ] 翻訳ファイル構造作成
- [ ] 日本語・英語の翻訳完成

### Phase 2: 追加言語（8言語）
- [ ] フランス語翻訳
- [ ] ドイツ語翻訳
- [ ] スペイン語翻訳
- [ ] イタリア語翻訳
- [ ] タイ語翻訳
- [ ] ベトナム語翻訳
- [ ] インドネシア語翻訳
- [ ] 韓国語翻訳

### Phase 3: バックエンド
- [ ] Gemini APIプロンプト多言語対応
- [ ] 書道家申込API作成
- [ ] メール送信サービス実装
- [ ] メールテンプレート作成（全言語）

### Phase 4: 決済準備（将来）
- [ ] 決済画面の配置設計
- [ ] Stripe/PayPal統合検討
- [ ] 価格設定（通貨対応）

---

## 8. 翻訳リソース

### 8.1 翻訳方法

| 方法 | メリット | デメリット |
|------|----------|-----------|
| プロ翻訳 | 高品質 | コスト高 |
| AI翻訳（GPT-4/Gemini） | 低コスト、高速 | 要レビュー |
| クラウドソーシング | 中コスト | 品質ばらつき |

**推奨:** AI翻訳 + ネイティブレビュー

### 8.2 翻訳ワークフロー

1. 日本語マスターファイル作成
2. AI（Gemini/GPT-4）で各言語に翻訳
3. 可能であればネイティブスピーカーがレビュー
4. フィードバック反映

---

## 9. テスト計画

- [ ] 各言語での表示確認
- [ ] 言語切り替え動作確認
- [ ] Gemini出力の言語品質確認
- [ ] メール送信テスト（各言語）
- [ ] モバイル言語自動検出テスト

---

## 10. 注意事項

1. **フォント対応**: Noto Sans は全対応言語をカバー
2. **RTL言語**: 現時点では非対応（アラビア語等は除外）
3. **文字数**: 言語により説明文の長さが異なる（英語は日本語より短くなる傾向）
4. **キャッシュ**: 言語切り替え時のキャッシュクリア考慮

---

## 付録: UI翻訳サンプル

```json
// locales/en/ui.json
{
  "start": "Start",
  "next": "Next",
  "your_kanji_name": "Your Kanji Name",
  "calligrapher_title": "A Calligrapher Will Write Your Name",
  "calligrapher_desc": "A professional calligrapher will write your kanji name in beautiful brush calligraphy and send it to you via email.",
  "email_placeholder": "Email address",
  "submit": "Request",
  "thank_you": "Thank you! Please wait for an email from our calligrapher."
}

// locales/ko/ui.json
{
  "start": "시작",
  "next": "다음",
  "your_kanji_name": "당신의 한자 이름",
  "calligrapher_title": "서예가가 당신의 이름을 써드립니다",
  "calligrapher_desc": "전문 서예가가 아름다운 붓글씨로 당신의 한자 이름을 써서 이메일로 보내드립니다.",
  "email_placeholder": "이메일 주소",
  "submit": "신청",
  "thank_you": "감사합니다! 서예가의 이메일을 기다려 주세요."
}
```
