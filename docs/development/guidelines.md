# 開発ガイドライン

## コードスタイルと規約

### Pythonコードスタイル
1. PEP 8ガイドラインに従う
2. 全ての関数パラメータと戻り値に型ヒントを使用
3. 最大行長: 100文字
4. 全ての公開関数とクラスにドキュメント文字列を使用

```python
def analyze_personality(
    answers: List[Answer],
    profile: PersonalityProfile
) -> Dict[str, float]:
    """
    質問回答に基づいて性格分析を行う。

    Args:
        answers: 質問への回答リスト
        profile: 現在の性格プロファイル

    Returns:
        性格特性スコアの辞書
    """
    pass
```

### TypeScript/Reactコードスタイル
1. フック付きの関数コンポーネントを使用
2. Airbnb JavaScriptスタイルガイドに準拠
3. TypeScriptのstrictモードを使用
4. 適切なエラー境界を実装

```typescript
interface PersonalityQuestionProps {
  question: Question;
  onAnswer: (answer: Answer) => void;
}

const PersonalityQuestion: React.FC<PersonalityQuestionProps> = ({
  question,
  onAnswer,
}) => {
  // 実装
};
```

## Gitワークフロー

### ブランチ命名規則
- 機能開発: `feature/説明`
- バグ修正: `fix/説明`
- 緊急修正: `hotfix/説明`
- リリース: `release/バージョン`

### コミットメッセージ形式
```
<種類>(<範囲>): <説明>

[任意の本文]

[任意のフッター]
```

種類:
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント変更
- style: コードスタイル変更
- refactor: リファクタリング
- test: テスト更新
- chore: ビルドプロセスやツールの変更

### プルリクエストのプロセス
1. developmentブランチから機能ブランチを作成
2. 変更を実装
3. テストの作成/更新
4. ドキュメントの更新
5. プルリクエストの作成
6. コードレビュー
7. フィードバックへの対応
8. developmentブランチへのマージ

## テストガイドライン

### フロントエンドのテスト
1. ユーティリティ関数の単体テスト
2. UIコンポーネントのテスト
3. フォームフローの結合テスト
4. 重要パスのE2Eテスト

```typescript
describe('性格分析', () => {
  it('特性スコアが正しく計算されること', () => {
    const answers = mockAnswers();
    const result = analyzePersonality(answers);
    expect(result.traits).toMatchSnapshot();
  });
});
```

### バックエンドのテスト
1. コアロジックの単体テスト
2. APIエンドポイントの結合テスト
3. 重要な処理のパフォーマンステスト

```python
def test_kanji_selection():
    profile = create_test_profile()
    result = select_kanji(profile)
    assert len(result) > 0
    assert all(is_valid_kanji(k) for k in result)
```

## セキュリティガイドライン

### フロントエンドのセキュリティ
1. 全てのユーザー入力のサニタイズ
2. 適切なCSRF保護の実装
3. セキュアなHTTPヘッダーの使用
4. APIコールのレート制限の実装

### バックエンドのセキュリティ
1. 全ての入力の検証
2. パラメータ化クエリの使用
3. 適切な認証の実装
4. セキュリティイベントのログ記録
5. 定期的な依存関係の更新

## パフォーマンスガイドライン

### フロントエンドのパフォーマンス
1. コンポーネントの遅延読み込み
2. 適切なキャッシュの実装
3. バンドルサイズの最適化
4. パフォーマンスモニタリングの実施

### バックエンドのパフォーマンス
1. キャッシュ戦略の実装
2. データベースクエリの最適化
3. 適切な非同期処理の使用
4. メモリ使用量の監視

## ドキュメント作成ガイドライン

### コードドキュメント
1. 明確で簡潔なコメントを使用
2. 複雑なアルゴリズムの説明
3. READMEファイルの更新
4. API仕様書の維持

### API仕様書
1. 全てのエンドポイントの説明
2. リクエスト/レスポンスの例を含める
3. エラーレスポンスの説明
4. OpenAPI仕様の更新

## エラー処理

### フロントエンドのエラー処理
1. エラー境界の実装
2. ネットワークエラーの適切な処理
3. ユーザーフレンドリーなエラーメッセージの表示
4. デバッグ用のエラーログ記録

### バックエンドのエラー処理
1. 適切な例外処理の使用
2. 適切なHTTPステータスコードの返却
3. レスポンスにエラー詳細を含める
4. コンテキスト付きのエラーログ記録

## モニタリングとロギング

### ログ記録規約
1. 適切なログレベルの使用
2. 関連するコンテキストの含有
3. 機密データのログ記録禁止
4. 構造化ログの使用

### モニタリング要件
1. APIレスポンスタイムの追跡
2. エラー率の監視
3. システムリソースの追跡
4. 重要な問題のアラート設定