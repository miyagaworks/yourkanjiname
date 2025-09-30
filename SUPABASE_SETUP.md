# Supabaseセットアップ手順

## ステップ1: プロジェクト作成

### 1.1 Supabaseにアクセス

1. [Supabase](https://supabase.com)を開く
2. "Start your project"または"Sign in"をクリック
3. GitHubアカウントでサインイン

### 1.2 新規プロジェクト作成

1. ダッシュボードで"New Project"をクリック
2. プロジェクト情報を入力:

```
Organization: 既存のものを選択、または新規作成
Project Name: yourkanjiname
Database Password: [強力なパスワードを生成] ← 重要！メモしてください
Region: Northeast Asia (Tokyo)
Pricing Plan: Free（開発・テスト用）
```

3. "Create new project"をクリック
4. プロジェクトの準備完了まで約2分待機

---

## ステップ2: データベーススキーマ作成

### 2.1 SQL Editorを開く

1. 左サイドバーから"SQL Editor"をクリック
2. "New query"をクリック

### 2.2 スキーマを実行

1. 以下のコマンドでschema.sqlの内容をコピー:

```bash
cat /Users/miyagawakiyomi/Projects/kanjiname/schema.sql
```

2. SQL Editorにペースト
3. 右下の"Run"ボタンをクリック
4. 成功メッセージ: "Success. No rows returned"

### 2.3 テーブル作成確認

左サイドバーから"Table Editor"を開いて、以下のテーブルが作成されていることを確認:

- [x] sessions
- [x] answers
- [x] gender_profiles
- [x] motivation_scores
- [x] motivation_subtypes
- [x] behavioral_traits
- [x] kanji_database
- [x] kanji_combinations
- [x] naming_results
- [x] japan_interest_survey

---

## ステップ3: 接続情報を取得

### 3.1 Database URLを取得

1. 左サイドバーから"Project Settings"（⚙️アイコン）をクリック
2. "Database"タブを選択
3. "Connection string"セクションを見つける
4. "URI"を選択
5. 表示されたURLをコピー:

```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

**重要**: `[YOUR-PASSWORD]`の部分を、ステップ1.2で設定したパスワードに置き換えてください。

### 3.2 Connection Pooling（推奨）

本番環境では"Connection Pooling"を使用します:

1. 同じ"Database"設定画面で"Connection Pooling"セクションを確認
2. "Transaction"モードを選択（推奨）
3. Pooled connection stringをコピー:

```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## ステップ4: ローカルでの接続テスト（オプション）

### 4.1 環境変数を設定

`.env`ファイルを更新:

```bash
# Supabase接続情報
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 4.2 接続テスト

```bash
# TypeScriptをビルド
npm run build

# サーバー起動
npm start
```

ブラウザで http://localhost:3000/health にアクセスして動作確認

---

## ステップ5: Vercel環境変数用に準備

以下の情報をメモしておいてください（次のVercelデプロイで使用）:

```
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

---

## トラブルシューティング

### エラー: "relation does not exist"

**原因**: テーブルが作成されていない
**解決策**: ステップ2.2のSQL実行を再度確認

### エラー: "password authentication failed"

**原因**: パスワードが間違っている
**解決策**:
1. Project Settings → Database → "Reset Database Password"
2. 新しいパスワードを生成
3. DATABASE_URLを更新

### エラー: "Connection timeout"

**原因**: ファイアウォールまたはネットワーク問題
**解決策**:
1. Supabaseプロジェクトが起動中か確認
2. Connection Pooling URLを使用
3. IPv6を無効化してIPv4を使用

### データベースのリセット

完全にやり直したい場合:

1. SQL Editorで以下を実行:

```sql
-- すべてのテーブルを削除
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

2. schema.sqlを再度実行

---

## セキュリティ設定（重要）

### Row Level Security（RLS）有効化

将来的にRLSを設定することを推奨:

```sql
-- セッションテーブルにRLSを有効化
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ポリシー例（匿名ユーザーは自分のセッションのみアクセス可能）
CREATE POLICY "Users can only access their own sessions"
ON sessions FOR ALL
USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');
```

現時点ではAPIサーバー経由でのみアクセスするため、RLSは必須ではありません。

---

## 次のステップ

✅ Supabaseセットアップ完了後:
- DATABASE_URLをVercel環境変数に設定
- Vercelデプロイを実行

DATABASE_URLを取得したら教えてください（パスワード部分は伏せて構いません）