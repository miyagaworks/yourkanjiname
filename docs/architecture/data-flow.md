## data-flow.md
```markdown
# データフロー設計書

## 1. 基本フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as フロントエンド
    participant API as APIサーバー
    participant Core as コア処理
    participant DB as データストア

    User->>UI: 名前入力
    UI->>API: 名前送信
    API->>Core: 名前分析リクエスト
    Core->>DB: 初期セッション作成
    DB-->>Core: セッションID返却
    Core-->>API: セッション情報
    API-->>UI: セッション情報

    User->>UI: 性格診断回答
    UI->>API: 回答データ送信
    API->>Core: 性格分析実行
    Core->>DB: 性格プロファイル保存
    Core->>Core: 漢字選定処理
    Core->>DB: 結果保存
    DB-->>Core: 保存確認
    Core-->>API: 生成結果
    API-->>UI: 結果表示データ