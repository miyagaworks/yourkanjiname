# API Schemas Specification

## 共通データ型

### Error
```typescript
{
  code: string;        // エラーコード
  message: string;     // エラーメッセージ
  details?: object;    // 詳細情報（オプション）
}
```

### SessionInfo
```typescript
{
  sessionId: string;   // セッションID
  createdAt: string;   // 作成日時
  updatedAt: string;   // 更新日時
  status: string;      // セッション状態
}
```

## 機能別スキーマ

### 名前生成関連

#### NameAnalysis
```typescript
{
  nameId: string;          // 名前分析ID
  originalName: string;    // 元の名前
  language: string;        // 入力言語
  status: NameStatus;      // 処理状態
  createdAt: string;       // 作成日時
}

enum NameStatus {
  INITIALIZED = 'initialized',
  ANALYZING = 'analyzing',
  PERSONALITY_REQUIRED = 'personality_required',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}
```

#### PersonalityProfile
```typescript
{
  traits: {
    [key: string]: number;   // 特性名: スコア値（0-1）
  };
  dominantTraits: string[];  // 主要な特性
  analysis: string;          // 分析結果の説明
}
```

#### KanjiName
```typescript
{
  kanji: string;            // 漢字名
  pronunciation: string;     // 発音
  meaning: string;          // 全体の意味
  characters: Array<{
    kanji: string;          // 個々の漢字
    meaning: string;        // 意味
    traits: string[];       // 関連する性格特性
    explanation: string;    // 選定理由の説明
  }>;
  personalityMatch: {
    score: number;          // 適合度スコア（0-1）
    explanation: string;    // 適合性の説明
  };
}
```

### 診断関連

#### Question
```typescript
{
  id: string;              // 質問ID
  text: string;            // 質問文
  type: QuestionType;      // 質問タイプ
  options: Array<{
    id: string;           // 選択肢ID
    text: string;         // 選択肢テキスト
    value: number;        // 数値スコア（0-1）
  }>;
  metadata?: {            // メタデータ（オプション）
    category: string;     // 質問カテゴリ
    weight: number;       // 重み付け
  };
}

enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  SCALE = 'scale'
}
```

#### Answer
```typescript
{
  questionId: string;     // 質問ID
  selectedOptions: string[];  // 選択された選択肢ID
  value: number;          // 回答の数値スコア
  timestamp: string;      // 回答日時
}
```

## データベースモデル

### KanjiData
```typescript
{
  kanji: string;          // 漢字
  meanings: string[];     // 意味の配列
  traits: {               // 性格特性との関連度
    [trait: string]: number;
  };
  usage: {
    frequency: number;    // 使用頻度
    contexts: string[];   // 使用文脈
  };
  metadata: {
    strokes: number;     // 画数
    level: string;       // 難易度
    category: string[];  // カテゴリ
  };
}
```