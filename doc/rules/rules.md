# ユアカンジネーム 開発規約・ルール

## 1. Git運用ルール

### 1.1 ブランチ戦略
- メインブランチ
  - `main`: 本番環境用。リリース済みコードのみを管理
  - `develop`: 開発用メインブランチ。次回リリースの開発を管理

- 作業用ブランチ
  - `feature/[JIRA-ID]_概要`: 新機能開発用
    - 例: `feature/KANJI-123_personality-analysis`
  - `fix/[JIRA-ID]_概要`: バグ修正用
    - 例: `fix/KANJI-456_audio-playback`
  - `refactor/[JIRA-ID]_概要`: リファクタリング用
    - 例: `refactor/KANJI-789_optimize-matching`
  - `hotfix/[JIRA-ID]_概要`: 緊急バグ修正用
    - 例: `hotfix/KANJI-999_critical-error`

### 1.2 コミットメッセージ規約
```
[種類] #[JIRA-ID] 概要

詳細な説明（必要な場合）

関連チケット: [チケット番号]
```

- 種類:
  - `[feat]`: 新機能
  - `[fix]`: バグ修正
  - `[refactor]`: リファクタリング
  - `[style]`: コードスタイル修正
  - `[docs]`: ドキュメント関連
  - `[test]`: テスト関連
  - `[chore]`: その他

例:
```
[feat] #KANJI-123 性格診断機能の実装

- 5つの質問項目を実装
- 回答のスコアリングロジックを追加
- 性格プロファイルの生成処理を実装

関連チケット: KANJI-124
```

### 1.3 プルリクエスト（PR）規約
- タイトル形式: `[種類] #JIRA-ID 概要`
- 必須項目:
  - 変更内容の要約
  - 動作確認項目
  - レビュー時の注意点
  - 関連チケット
- レビュー承認者: 最低2名必要
- マージ前チェックリスト:
  - [ ] テストが全て成功
  - [ ] リンター警告なし
  - [ ] 型チェックエラーなし
  - [ ] ドキュメント更新済み

## 2. コーディング規約

## 2. 1 ファイルパス表記
全てのコードファイルの先頭に、以下の形式でファイルパスをコメントとして記載する：
// src/path/to/filename.tsx

例：
// src/components/ui/alert.tsx

この規則は以下の目的で必須：
- ファイル配置の明確化
- コードレビューの効率化
- ファイル構造の一貫性維持

### 2.2 Python (バックエンド)
- PEP 8に準拠
- 最大行長: 100文字
- インデント: 4スペース
- 文字列: ダブルクォート使用

```python
# Good
def analyze_personality(
    answers: List[Answer],
    profile: PersonalityProfile
) -> Dict[str, float]:
    """性格分析を実行し、特性スコアを返却する。

    Args:
        answers: 質問への回答リスト
        profile: 既存の性格プロファイル

    Returns:
        特性名をキー、スコア(0-1)を値とする辞書
    """
    return calculate_trait_scores(answers, profile)

# Bad
def analyzePersonality(a,p):
    return calculateTraitScores(a,p)
```

### 2.3 TypeScript/React (フロントエンド)
- ESLintのAirbnb設定をベースに使用
- インデント: 2スペース
- 最大行長: 100文字
- セミコロン必須

```typescript
// Good
interface PersonalityQuestionProps {
  question: Question;
  onAnswer: (answer: Answer) => void;
  isLoading?: boolean;
}

const PersonalityQuestion: React.FC<PersonalityQuestionProps> = ({
  question,
  onAnswer,
  isLoading = false,
}) => {
  const handleSubmit = useCallback((value: string) => {
    onAnswer({ questionId: question.id, value });
  }, [question.id, onAnswer]);

  return (
    <div className="question-container">
      {/* コンポーネントの内容 */}
    </div>
  );
};

// Bad
const personalityQuestion = (props) => {
  return <div>{props.question.text}</div>
}
```

## 3. 命名規則

### 3.1 共通ルール
- 略語は避け、明確な命名を使用
- 単数/複数を適切に使い分け
- 一貫性のある命名パターンを使用

### 3.2 Python固有の命名規則
- クラス: UpperCamelCase
  ```python
  class PersonalityAnalyzer:
  class KanjiSelector:
  ```

- 関数/メソッド/変数: snake_case
  ```python
  def calculate_trait_scores():
  user_profile = get_profile()
  ```

- 定数: UPPER_SNAKE_CASE
  ```python
  MAX_QUESTIONS = 5
  DEFAULT_TIMEOUT = 30
  ```

- プライベートメンバー: アンダースコアプレフィックス
  ```python
  _cached_results = {}
  def _validate_input():
  ```

### 3.3 TypeScript/React固有の命名規則
- コンポーネント: UpperCamelCase
  ```typescript
  const PersonalityQuestion = () => {};
  const KanjiDisplay = () => {};
  ```

- 関数/変数: camelCase
  ```typescript
  const handleSubmit = () => {};
  const userProfile = {};
  ```

- インターフェース: UpperCamelCase + プレフィックスI
  ```typescript
  interface IPersonalityProfile {};
  interface IKanjiData {};
  ```

- 型定義: UpperCamelCase + サフィックスType
  ```typescript
  type AnswerType = {};
  type ScoreType = number;
  ```

- カスタムフック: use プレフィックス
  ```typescript
  const usePersonalityAnalysis = () => {};
  const useKanjiSelection = () => {};
  ```

## 4. ドキュメント管理ルール

### 4.1 ドキュメントの種類と配置
- プロジェクトルート
  - `README.md`: プロジェクト概要、セットアップ手順
  - `CONTRIBUTING.md`: コントリビューション規約
  - `CHANGELOG.md`: 変更履歴

- `/docs`ディレクトリ
  - `/api`: API仕様書
  - `/architecture`: システム設計書
  - `/development`: 開発者向けドキュメント
  - `/operations`: 運用・保守ドキュメント

### 4.2 ドキュメント作成規約
- Markdownフォーマットを使用
- 見出しレベルは最大3階層まで
- コードブロックは言語指定を必須
- 図表はMermaid記法を使用

### 4.3 API仕様書規約
- OpenAPI (Swagger) 形式で記述
- エンドポイントごとにファイル分割
- リクエスト/レスポンス例を必須記載
- エラーレスポンスの詳細を記載

### 4.4 ドキュメント更新ルール
- コード変更に伴うドキュメント更新は同一PR内で実施
- API仕様書は自動生成・更新を基本とする
- 重要な変更は`CHANGELOG.md`に記録
- ドキュメントレビューはコードレビューと同様に実施

### 4.5 コメント記述規約
- 公開関数・クラスは必ずドキュメンテーションコメントを記述
- 複雑なロジックには説明コメントを追加
- TODO/FIXMEコメントは課題管理システムのチケットIDを記載

Python例:
```python
def select_kanji(
    profile: PersonalityProfile,
    constraints: KanjiConstraints
) -> List[Kanji]:
    """性格プロファイルに基づいて最適な漢字を選定する。

    Args:
        profile: ユーザーの性格プロファイル
        constraints: 漢字選定の制約条件

    Returns:
        選定された漢字のリスト

    Raises:
        NoMatchingKanjiError: 条件に合う漢字が見つからない場合
    """
    # TODO: #KANJI-234 パフォーマンス最適化
    pass
```

TypeScript例:
```typescript
/**
 * 性格診断の回答を検証し、スコアを計算する
 * @param answers - ユーザーの回答リスト
 * @returns 計算された特性スコア
 * @throws {ValidationError} 回答が不正な場合
 */
const calculateTraitScores = (answers: Answer[]): TraitScores => {
  // FIXME: #KANJI-345 エッジケースの処理を改善
};
```