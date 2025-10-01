# Railway バックエンドAPIデプロイ手順

## Railwayとは

- 無料枠: 月$5分の無料クレジット（約500時間稼働）
- Node.js、PostgreSQL、その他多くの言語/DBに対応
- GitHubと連携して自動デプロイ

---

## ステップ1: Railwayアカウント作成

1. **https://railway.app** にアクセス
2. **"Login"** → **"Login with GitHub"**
3. GitHubアカウントで認証
4. 必要に応じてメール認証

---

## ステップ2: 新規プロジェクト作成

### 2.1 プロジェクト作成

1. ダッシュボードで **"New Project"** をクリック
2. **"Deploy from GitHub repo"** を選択
3. `miyagaworks/yourkanjiname` を検索して選択
4. **"Deploy Now"** をクリック

### 2.2 ルートパス設定（重要）

Railwayはルートディレクトリからビルドしますが、フロントエンドは無視する必要があります。

1. デプロイされたサービスをクリック
2. **"Settings"** タブを開く
3. **"Root Directory"** を探す
4. 空欄のまま（ルートでOK）
5. **"Start Command"** を設定:
   ```
   npm start
   ```
6. **"Build Command"** を設定:
   ```
   npm run build
   ```

---

## ステップ3: 環境変数設定

### 3.1 Variables タブを開く

1. サービス → **"Variables"** タブ
2. **"New Variable"** をクリック

### 3.2 必須環境変数を追加

| Variable Name | Value |
|---------------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` (Railwayが自動設定する場合は不要) |
| `DATABASE_URL` | `postgres://postgres:パスワード@db.mkelvvpglrkbocykeafb.supabase.co:6543/postgres` |
| `GEMINI_API_KEY` | `あなたのGemini APIキー` |
| `FRONTEND_URL` | `https://yourkanjiname.vercel.app` (Vercel URL) |
| `ALLOWED_ORIGINS` | `https://yourkanjiname.vercel.app,https://app.kanjiname.jp` |

**重要:**
- `DATABASE_URL`: Supabaseの接続URL
- `FRONTEND_URL`: VercelのデプロイURL（一旦仮のURLを設定、後でカスタムドメインに変更）

---

## ステップ4: デプロイ実行

### 4.1 デプロイトリガー

環境変数を保存すると、自動的に再デプロイが始まります。

### 4.2 デプロイログ確認

1. **"Deployments"** タブを開く
2. 最新のデプロイをクリック
3. ビルドログを確認:
   ```
   Installing dependencies...
   Building TypeScript...
   Starting server...
   ✓ Deployed
   ```

### 4.3 公開URLを取得

1. **"Settings"** タブ
2. **"Domains"** セクションを見つける
3. Railway提供のURL: `https://yourkanjiname-production-xxxx.up.railway.app`

このURLをコピーしてください。

---

## ステップ5: 動作確認

### 5.1 Health Check

ブラウザでRailway URLにアクセス:

```
https://yourkanjiname-production-xxxx.up.railway.app/health
```

正常なレスポンス:
```json
{
  "status": "ok",
  "timestamp": "2025-09-30T..."
}
```

### 5.2 API エンドポイント確認

```
https://yourkanjiname-production-xxxx.up.railway.app/api/sessions
```

405エラー（Method Not Allowed）が返ればOK（POSTメソッドが必要なため）

---

## ステップ6: VercelのAPI URLを更新

### 6.1 Vercel環境変数更新

1. Vercel Dashboard → あなたのプロジェクト
2. **Settings** → **Environment Variables**
3. `REACT_APP_API_URL` を追加/更新:
   ```
   https://yourkanjiname-production-xxxx.up.railway.app/api
   ```
4. **Save**

### 6.2 Vercel再デプロイ

1. **Deployments** タブ
2. 最新のデプロイ → **"Redeploy"**
3. 環境変数が反映されます

---

## ステップ7: カスタムドメイン設定（オプション）

### 7.1 Railway カスタムドメイン

1. Railway → Settings → **"Domains"**
2. **"Custom Domain"** をクリック
3. `api.kanjiname.jp` を入力
4. 表示されるCNAMEレコードをメモ

### 7.2 Cloudflare DNS設定

```
Type: CNAME
Name: api
Target: yourkanjiname-production-xxxx.up.railway.app
Proxy: OFF (オレンジクラウドをグレーに)
```

**重要**: RailwayのカスタムドメインはProxyをOFFにする必要があります。

---

## トラブルシューティング

### エラー: "Cannot connect to database"

**原因**: DATABASE_URLが間違っている
**解決策**:
1. Railway → Variables → DATABASE_URLを確認
2. Supabaseの接続URLが正しいか確認
3. 再デプロイ

### エラー: "GEMINI_API_KEY is not set"

**原因**: 環境変数が設定されていない
**解決策**:
1. Railway → Variables → GEMINI_API_KEYを追加
2. Google AI Studioで新しいキーを取得

### エラー: "Port already in use"

**原因**: PORTの競合
**解決策**:
1. `PORT`環境変数を削除（Railwayが自動設定）
2. または明示的に`PORT=3000`を設定

### ビルドエラー: "TypeScript compilation failed"

**原因**: TypeScriptエラー
**解決策**:
1. ローカルで`npm run build`を実行してエラーを特定
2. 修正してGitHubにプッシュ
3. Railwayが自動的に再デプロイ

---

## 次のステップ

✅ Railway API デプロイ完了後:
- Vercel環境変数にRailway URLを設定
- フロントエンド→バックエンドの通信をテスト
- Cloudflareでカスタムドメイン設定

Railway URLを取得したら教えてください！