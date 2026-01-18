# API Endpoints Specification

## Base URL
```
/api/v1
```

## Endpoints

### 名前生成関連 `/names`

#### POST `/names/analyze`
名前の入力を受け付け、初期分析を行います。

**Request**
```json
{
  "name": "string",     // 入力名（アルファベット）
  "language": "string"  // 入力言語（現在は "en" のみ対応）
}
```

**Response**
```json
{
  "sessionId": "string",    // セッションID
  "nameId": "string",       // 名前分析ID
  "status": "initialized",  // 処理状態
  "originalName": "string"  // 入力された名前
}
```

#### POST `/names/personality`
性格診断の回答を送信します。

**Request**
```json
{
  "sessionId": "string",
  "nameId": "string",
  "answers": [
    {
      "questionId": "string",
      "answerId": "string",
      "value": "number"     // 回答の数値（0-1）
    }
  ]
}
```

**Response**
```json
{
  "status": "processing",
  "personalityProfile": {
    "traits": {
      "traitName": "number"  // 各特性のスコア
    }
  },
  "nextQuestion": {          // null の場合は診断完了
    "questionId": "string",
    "text": "string",
    "options": [
      {
        "id": "string",
        "text": "string"
      }
    ]
  }
}
```

#### GET `/names/result/{nameId}`
生成された漢字名の結果を取得します。

**Response**
```json
{
  "status": "completed",
  "result": {
    "kanjiName": "string",           // 生成された漢字名
    "pronunciation": "string",        // 発音（ローマ字）
    "explanation": {
      "overall": "string",           // 全体の説明
      "personalityMatch": "string",  // 性格との適合性の説明
      "characters": [
        {
          "kanji": "string",         // 個々の漢字
          "meaning": "string",       // 意味
          "traits": ["string"],      // 関連する性格特性
          "explanation": "string"    // 個別の説明
        }
      ]
    }
  }
}
```

### 診断関連 `/personality`

#### GET `/personality/questions`
利用可能な診断質問を取得します。

**Response**
```json
{
  "questions": [
    {
      "id": "string",
      "text": "string",
      "type": "string",     // 質問タイプ
      "options": [
        {
          "id": "string",
          "text": "string",
          "value": "number"
        }
      ]
    }
  ]
}
```

### システム関連 `/system`

#### GET `/system/health`
システムの健康状態を確認します。

**Response**
```json
{
  "status": "string",     // "healthy" or "unhealthy"
  "timestamp": "string",
  "version": "string"
}
```