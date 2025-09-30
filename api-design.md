# YourKanjiName API設計

## 概要
- RESTful API
- JSON形式でのデータ通信
- セッションベースの回答管理
- TypeScript + Node.js (Express/Fastify) 推奨

---

## エンドポイント一覧

### 1. セッション管理

#### `POST /api/sessions`
**新しいセッションを作成**

**Request:**
```json
{}
```

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-09-30T10:00:00Z",
  "current_question_id": "Q0"
}
```

**Status Codes:**
- `201 Created`: セッション作成成功
- `500 Internal Server Error`: サーバーエラー

---

#### `GET /api/sessions/:session_id`
**セッション情報を取得**

**Response:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-09-30T10:00:00Z",
  "updated_at": "2025-09-30T10:05:00Z",
  "completed": false,
  "current_question_id": "Q6",
  "answers_count": 5
}
```

**Status Codes:**
- `200 OK`: 取得成功
- `404 Not Found`: セッションが存在しない

---

### 2. 質問取得

#### `GET /api/questions/:question_id`
**特定の質問を取得**

**Query Parameters:**
- `lang` (optional): `ja` | `en` (デフォルト: `ja`)

**Response:**
```json
{
  "id": "Q6",
  "type": "childhood_motivation",
  "text": {
    "ja": "子供の頃(5-8歳頃)、時間を忘れて一番夢中になったことは?",
    "en": "When you were a child (around 5-8 years old), what did you get most absorbed in?"
  },
  "options": [
    {
      "id": "A",
      "text": {
        "ja": "図鑑を見たり、「なぜ?」「どうして?」と質問すること",
        "en": "Looking at picture books, asking 'why?' and 'how?'"
      }
    }
  ]
}
```

**Status Codes:**
- `200 OK`: 取得成功
- `404 Not Found`: 質問が存在しない

---

#### `GET /api/sessions/:session_id/next-question`
**セッションの次の質問を取得**

フローロジックに基づいて、次に表示すべき質問を返す。

**Query Parameters:**
- `lang` (optional): `ja` | `en`

**Response:**
```json
{
  "question": {
    "id": "M-1",
    "type": "gender_trait_check",
    "text": {
      "ja": "グループで何かを決める時、あなたはどの役割になりがちですか?",
      "en": "When making decisions in a group, what role do you tend to take?"
    },
    "options": [...]
  },
  "progress": {
    "current_step": 6,
    "total_steps": 13,
    "percentage": 46
  }
}
```

**Status Codes:**
- `200 OK`: 取得成功
- `404 Not Found`: セッション不明
- `409 Conflict`: セッションが既に完了済み

---

### 3. 回答送信

#### `POST /api/sessions/:session_id/answers`
**回答を記録**

**Request:**
```json
{
  "question_id": "Q6",
  "answer_option": "A"
}
```

**Response:**
```json
{
  "success": true,
  "next_question_id": "Q7",
  "message": "Answer recorded successfully"
}
```

**Status Codes:**
- `201 Created`: 回答記録成功
- `400 Bad Request`: 不正なリクエスト
- `404 Not Found`: セッション不明
- `409 Conflict`: 既に回答済み

---

### 4. スコアリング

#### `GET /api/sessions/:session_id/scores`
**現在のスコアを取得 (デバッグ用)**

**Response:**
```json
{
  "gender_profile": {
    "declared_gender": "male",
    "trait_score": 5,
    "category": "soft_masculine"
  },
  "motivation_scores": {
    "knowledge": 8,
    "creative": 3,
    "belonging": 2,
    "dominance": 5,
    "stability": 1,
    "freedom": 4
  },
  "highest_motivation": "knowledge",
  "subtype_scores": {
    "truth_seeking": 5,
    "learning_growth": 3,
    "understanding_sharing": 2
  },
  "highest_subtype": "truth_seeking"
}
```

**Status Codes:**
- `200 OK`: 取得成功
- `404 Not Found`: セッション不明
- `422 Unprocessable Entity`: 回答が不十分

---

### 5. 漢字名生成

#### `POST /api/sessions/:session_id/generate`
**漢字名を生成**

全ての質問に回答後、このエンドポイントを呼び出して漢字名を生成。

**Request:**
```json
{}
```

**Response:**
```json
{
  "kanji_name": "優彩",
  "first_kanji": {
    "char": "優",
    "meaning_en": "gentle, graceful, superior",
    "meaning_ja": "優しい、優れた",
    "pronunciation_on": ["ユウ"],
    "pronunciation_kun": ["やさ-しい", "すぐ-れる"]
  },
  "second_kanji": {
    "char": "彩",
    "meaning_en": "color, paint, makeup",
    "meaning_ja": "彩り、色どる",
    "pronunciation_on": ["サイ"],
    "pronunciation_kun": ["いろど-る"]
  },
  "explanation": {
    "ja": "あなたの優しさと創造性を表現した名前です。「優」は思いやり深い性格を、「彩」は豊かな表現力を象徴しています。",
    "en": "This name expresses your gentleness and creativity. '優' symbolizes your compassionate nature, while '彩' represents your rich expressiveness."
  },
  "matching_scores": {
    "total": 92,
    "gender_match": 90,
    "motivation_match": 95,
    "subtype_match": 91
  },
  "pronunciation": {
    "romaji": "Yusai",
    "hiragana": "ゆうさい"
  }
}
```

**Status Codes:**
- `200 OK`: 生成成功
- `404 Not Found`: セッション不明
- `422 Unprocessable Entity`: 質問に未回答あり
- `500 Internal Server Error`: 生成失敗

---

#### `GET /api/sessions/:session_id/result`
**生成済みの結果を取得**

既に生成された漢字名を取得。

**Response:**
上記と同じ形式

**Status Codes:**
- `200 OK`: 取得成功
- `404 Not Found`: セッション不明または結果未生成

---

### 6. 統計・分析 (オプション)

#### `GET /api/stats/popular-kanji`
**人気の漢字トップ20**

**Response:**
```json
{
  "popular_kanji": [
    {
      "kanji": "優",
      "usage_count": 1234,
      "percentage": 8.5
    },
    {
      "kanji": "翔",
      "usage_count": 1100,
      "percentage": 7.6
    }
  ]
}
```

---

#### `GET /api/stats/motivation-distribution`
**動機タイプの分布**

**Response:**
```json
{
  "distribution": {
    "knowledge": 18.5,
    "creative": 22.3,
    "belonging": 15.8,
    "dominance": 12.4,
    "stability": 16.2,
    "freedom": 14.8
  },
  "total_sessions": 5432
}
```

---

## エラーレスポンス形式

全てのエラーレスポンスは以下の形式:

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "The specified session does not exist",
    "details": {}
  }
}
```

### エラーコード一覧

- `SESSION_NOT_FOUND`: セッションが存在しない
- `QUESTION_NOT_FOUND`: 質問が存在しない
- `INVALID_ANSWER`: 不正な回答
- `ALREADY_ANSWERED`: 既に回答済み
- `SESSION_COMPLETED`: セッション完了済み
- `INSUFFICIENT_ANSWERS`: 回答が不十分
- `GENERATION_FAILED`: 漢字名生成失敗
- `DATABASE_ERROR`: データベースエラー
- `INTERNAL_ERROR`: 内部エラー

---

## 認証・セキュリティ

### セッションID管理
- UUIDv4を使用
- HTTPSのみ許可 (本番環境)
- CORS設定: フロントエンドドメインのみ許可

### レート制限
- セッション作成: 10回/時間/IP
- 回答送信: 100回/時間/セッション
- 漢字名生成: 5回/時間/セッション

### データ保護
- 個人を特定できる情報は収集しない
- IPアドレスは統計目的のみ(ハッシュ化)
- セッションデータは90日後自動削除

---

## 実装推奨事項

### バックエンド構成
```
src/
├── routes/
│   ├── sessions.ts
│   ├── questions.ts
│   ├── answers.ts
│   └── generation.ts
├── controllers/
│   ├── SessionController.ts
│   ├── QuestionController.ts
│   ├── AnswerController.ts
│   └── GenerationController.ts
├── services/
│   ├── ScoringService.ts
│   ├── KanjiMatchingService.ts
│   └── FlowService.ts
├── models/
│   ├── Session.ts
│   ├── Answer.ts
│   └── KanjiResult.ts
├── utils/
│   ├── scoring.ts (既存)
│   └── validation.ts
└── app.ts
```

### ミドルウェア
- `validateSession`: セッションIDの検証
- `validateAnswer`: 回答形式の検証
- `rateLimit`: レート制限
- `errorHandler`: エラーハンドリング
- `logger`: リクエストログ

### キャッシング
- 質問データ: メモリキャッシュ(Redis推奨)
- 漢字データベース: アプリケーション起動時にロード
- セッションデータ: Redis (TTL: 24時間)

---

## 次のステップ

1. **漢字データベース構築**: kanji_database テーブルへのデータ投入
2. **漢字マッチングアルゴリズム**: スコアから最適な漢字を選択
3. **API実装**: Express/Fastifyでの実装
4. **テスト**: 単体テスト、統合テスト
5. **デプロイ**: Docker化、CI/CD構築