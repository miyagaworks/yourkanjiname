# Vercelデプロイ手順

## 前提条件

✅ GitHubリポジトリ: `miyagaworks/yourkanjiname`
✅ Supabase DATABASE_URL取得済み

---

## ステップ1: Vercelプロジェクト作成

### 1.1 Vercelにサインイン

1. **https://vercel.com** にアクセス
2. "Sign Up" または "Log in"
3. **"Continue with GitHub"** を選択
4. GitHubアカウントで認証

### 1.2 プロジェクトをインポート

1. ダッシュボードで **"Add New..."** → **"Project"** をクリック
2. "Import Git Repository"セクションで検索: `yourkanjiname`
3. `miyagaworks/yourkanjiname` を見つけて **"Import"** をクリック

---

## ステップ2: ビルド設定

### 2.1 Configure Project画面

以下の設定を入力:

```
Framework Preset: Other
Root Directory: ./
Build Command: npm run build && cd frontend && npm install && npm run build
Output Directory: frontend/build
Install Command: npm install
```

**重要**: まだ"Deploy"を押さないでください！先に環境変数を設定します。

---

## ステップ3: 環境変数設定

### 3.1 Environment Variablesセクションを展開

"Configure Project"画面の下部にある **"Environment Variables"** を見つけます。

### 3.2 以下の環境変数を追加

#### 必須の環境変数

| Key | Value | 説明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 本番環境モード |
| `DATABASE_URL` | `postgres://postgres:[YOUR-PASSWORD]@db.mkelvvpglrkbocykeafb.supabase.co:6543/postgres` | Supabase接続URL |
| `GEMINI_API_KEY` | `あなたのGemini APIキー` | Google Gemini API |
| `FRONTEND_URL` | `https://app.kanjiname.jp` | フロントエンドURL（一旦仮） |
| `ALLOWED_ORIGINS` | `https://app.kanjiname.jp,https://kanjiname.jp` | CORS許可オリジン |

**重要**:
- `DATABASE_URL`: `[YOUR-PASSWORD]`を実際のパスワードに置き換えてください
- `GEMINI_API_KEY`: [Google AI Studio](https://aistudio.google.com/app/apikey)で取得

### 3.3 Gemini API Keyの取得方法

1. https://aistudio.google.com/app/apikey にアクセス
2. "Create API Key" をクリック
3. プロジェクトを選択（または新規作成）
4. 生成されたAPIキーをコピー

---

## ステップ4: デプロイ実行

### 4.1 デプロイ開始

1. すべての環境変数を設定したら、**"Deploy"** ボタンをクリック
2. ビルドログが表示されます（3-5分程度）

### 4.2 ビルドプロセス

以下の順序で実行されます:

```
1. Installing dependencies... (npm install)
2. Building backend... (npm run build)
3. Installing frontend dependencies... (cd frontend && npm install)
4. Building frontend... (npm run build)
5. Deploying...
```

### 4.3 デプロイ成功確認

✅ "Congratulations!" メッセージが表示される
✅ デプロイURL: `https://yourkanjiname-xxx.vercel.app`

---

## ステップ5: 動作確認

### 5.1 デプロイURLにアクセス

1. Vercelが生成したURLをクリック: `https://yourkanjiname-xxx.vercel.app`
2. スプラッシュスクリーンが表示される
3. 名前入力画面が表示される

### 5.2 テスト実行

1. 名前を入力: 例 "John Smith"
2. 質問に回答
3. 漢字名が生成されることを確認

---

## トラブルシューティング

### エラー: "Build failed"

**原因**: TypeScriptコンパイルエラー、依存関係の問題
**解決策**:
1. ビルドログを確認
2. ローカルで `npm run build` を実行してエラーを特定
3. 修正してGitHubにプッシュ
4. Vercelが自動的に再デプロイ

### エラー: "Cannot connect to database"

**原因**: DATABASE_URLが間違っている
**解決策**:
1. Vercel → Project → Settings → Environment Variables
2. DATABASE_URLを確認・修正
3. Deployments → 最新デプロイ → "Redeploy"

### エラー: "API key invalid" (Gemini)

**原因**: GEMINI_API_KEYが間違っている、または無効
**解決策**:
1. Google AI Studioで新しいAPIキーを生成
2. Vercelの環境変数を更新
3. 再デプロイ

### エラー: "CORS policy"

**原因**: ALLOWED_ORIGINSが正しく設定されていない
**解決策**:
1. Vercelの環境変数でALLOWED_ORIGINSを確認
2. デプロイURLを含めて設定:
   ```
   ALLOWED_ORIGINS=https://yourkanjiname-xxx.vercel.app,https://app.kanjiname.jp
   ```

---

## ステップ6: カスタムドメイン設定

### 6.1 Vercelでドメイン追加

1. Project → Settings → **"Domains"**
2. "Add Domain" をクリック
3. `app.kanjiname.jp` を入力
4. "Add" をクリック

### 6.2 DNS設定情報を取得

Vercelが表示する設定:

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

この情報を次のCloudflare設定で使用します。

---

## ステップ7: 環境変数の更新（ドメイン設定後）

カスタムドメイン設定後、以下の環境変数を更新:

1. Vercel → Settings → Environment Variables
2. `FRONTEND_URL` を更新:
   ```
   FRONTEND_URL=https://app.kanjiname.jp
   ```
3. `ALLOWED_ORIGINS` を更新:
   ```
   ALLOWED_ORIGINS=https://app.kanjiname.jp,https://kanjiname.jp
   ```
4. 再デプロイ

---

## 次のステップ

✅ Vercelデプロイ完了後:
- Cloudflareでカスタムドメイン設定
- SSL証明書の自動発行を確認
- 本番環境での動作テスト

デプロイが完了したら、生成されたURLを教えてください！