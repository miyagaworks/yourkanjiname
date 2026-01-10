# YourKanjiName デプロイメントガイド

## 本番環境構成

- **ドメイン**: kanjiname.jp
- **サブドメイン**: app.kanjiname.jp または your.kanjiname.jp
- **ホスティング**: Vercel
- **データベース**: Neon (PostgreSQL)
- **DNS/Email**: Cloudflare

---

## 1. Neonセットアップ

### 1.1 プロジェクト作成

1. [Neon](https://neon.tech)にログイン
2. "New Project"をクリック
3. プロジェクト情報を入力:
   - Name: `yourkanjiname`
   - Region: `Asia Pacific (Singapore)` を選択

### 1.2 データベーススキーマ作成

1. Neon Dashboard → SQL Editor
2. `schema.sql`の内容を全てコピー&ペースト
3. "Run"をクリックしてスキーマを作成

### 1.3 接続情報取得

1. Dashboard → Connection Details
2. Connection stringをコピー (例: `postgresql://user:password@host/dbname?sslmode=require`)
3. この値を`DATABASE_URL`として後でVercelに設定

---

## 2. Vercelデプロイ

### 2.1 プロジェクトインポート

1. [Vercel](https://vercel.com)にログイン
2. "Add New..." → "Project"
3. GitHubリポジトリを選択 (事前にGitHubにpush必要)
4. または "Import Git Repository"で直接インポート

### 2.2 ビルド設定

**Framework Preset**: Other
**Root Directory**: `./`
**Build Command**:
```bash
npm run build && cd frontend && npm install && npm run build
```
**Output Directory**: `frontend/build`

### 2.3 環境変数設定

Settings → Environment Variables で以下を追加:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
GEMINI_API_KEY=your_gemini_api_key_here
FRONTEND_URL=https://app.kanjiname.jp
ALLOWED_ORIGINS=https://app.kanjiname.jp,https://kanjiname.jp
```

### 2.4 デプロイ実行

1. "Deploy"をクリック
2. ビルド完了を待つ (3-5分程度)
3. デプロイ完了後、Vercelが提供するURLで動作確認

---

## 3. カスタムドメイン設定

### 3.1 Vercelでドメイン追加

1. Vercel Dashboard → Project → Settings → Domains
2. "Add Domain"をクリック
3. `app.kanjiname.jp` (または `your.kanjiname.jp`) を入力
4. Vercelが表示するDNSレコード情報をメモ:
   - Type: `CNAME`
   - Name: `app` (または `your`)
   - Value: `cname.vercel-dns.com`

---

## 4. Cloudflare DNS設定

### 4.1 ドメイン追加 (初回のみ)

1. [Cloudflare](https://cloudflare.com)にログイン
2. "Add a Site"をクリック
3. `kanjiname.jp`を入力
4. プランを選択 (Freeプランで十分)
5. Cloudflareが表示するネームサーバーをドメインレジストラ(お名前.comなど)で設定

### 4.2 DNSレコード設定

DNS → Records で以下を追加:

**アプリケーション用サブドメイン:**
```
Type: CNAME
Name: app (または your)
Target: cname.vercel-dns.com
Proxy status: Proxied (オレンジクラウド)
```

**メインドメイン (オプション):**
```
Type: A
Name: @ (root)
IPv4 address: Vercelが提供するIPアドレス
Proxy status: Proxied
```

### 4.3 SSL/TLS設定

1. SSL/TLS → Overview
2. Encryption mode: **Full (strict)** に設定
3. Edge Certificates → Always Use HTTPS: **On**

---

## 5. Cloudflare Email設定

### 5.1 Email Routing有効化

1. Email → Email Routing
2. "Enable Email Routing"をクリック
3. MXレコードが自動的に追加される

### 5.2 メールアドレス設定

例: `info@kanjiname.jp`, `support@kanjiname.jp`

1. Email → Email Routing → Destination addresses
2. "Add destination address"で転送先メールアドレスを追加
3. 確認メールが届くので認証
4. Email → Email Routing → Routing rules
5. カスタムアドレスから転送先へのルールを作成

---

## 6. 動作確認チェックリスト

### 6.1 アプリケーション動作確認

- [ ] https://app.kanjiname.jp にアクセスできる
- [ ] スプラッシュスクリーンが表示される
- [ ] 名前入力 → 質問 → 結果生成が正常に動作
- [ ] 言語切り替え (EN/日本語) が動作
- [ ] モバイル表示が正常

### 6.2 API動作確認

ブラウザの開発者ツール (Network タブ) で確認:

- [ ] `/api/sessions` - セッション作成
- [ ] `/api/sessions/:id/next-question` - 質問取得
- [ ] `/api/sessions/:id/answers` - 回答送信
- [ ] `/api/sessions/:id/generate` - 漢字名生成

### 6.3 データベース確認

Neon Dashboard → Tables で確認:

- [ ] `sessions` テーブルにレコードが追加される
- [ ] `answers` テーブルに回答が記録される
- [ ] `gender_profiles`, `motivation_scores` などが正常に保存
- [ ] `naming_results` に最終結果が保存される

---

## 7. 環境変数一覧

### Vercel環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NODE_ENV` | 環境設定 | `production` |
| `DATABASE_URL` | Neon接続文字列 | `postgresql://...` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIza...` |
| `FRONTEND_URL` | フロントエンドURL | `https://app.kanjiname.jp` |
| `ALLOWED_ORIGINS` | CORS許可オリジン | `https://app.kanjiname.jp,https://kanjiname.jp` |

### Reactフロントエンド環境変数

`frontend/.env.production`:
```
REACT_APP_API_URL=https://app.kanjiname.jp/api
```

---

## 8. トラブルシューティング

### ビルドエラー

**エラー**: `Cannot find module 'xyz'`
**解決策**: `package.json`の依存関係を確認、`npm install`を実行

**エラー**: `TypeScript compilation failed`
**解決策**: `npm run build`をローカルで実行してエラー箇所を特定

### データベース接続エラー

**エラー**: `ECONNREFUSED` または `Connection timeout`
**解決策**:
- Neonのプロジェクトが起動しているか確認
- `DATABASE_URL`が正しいか確認
- Neon → Connection Details → Pooled connectionを使用

### CORS エラー

**エラー**: `Access to fetch at '...' has been blocked by CORS policy`
**解決策**:
- `ALLOWED_ORIGINS`環境変数を確認
- `src/server.ts`のCORS設定を確認

### Gemini API エラー

**エラー**: `503 Service Unavailable`
**解決策**:
- リトライロジックが既に実装済み (3回まで自動リトライ)
- API quotaを確認: [Google AI Studio](https://aistudio.google.com/)

---

## 9. メンテナンス

### ログ確認

**Vercel:**
- Dashboard → Project → Deployments → 該当デプロイ → "View Function Logs"

**Neon:**
- Dashboard → Monitoring → Query insights

### データベースバックアップ

Neon Dashboard → Branches
- ブランチ機能でデータベースのスナップショットを作成可能

### モニタリング

**推奨ツール:**
- Vercel Analytics (訪問者数、パフォーマンス)
- Neon Monitoring (DB接続数、クエリ数)
- Google Cloud Console (Gemini API使用量)

---

## 10. セキュリティチェックリスト

- [ ] 環境変数にシークレットキーを直接コミットしていない
- [ ] `.gitignore`に`.env`が含まれている
- [ ] Cloudflare Web Application Firewall (WAF) を有効化
- [ ] Rate Limiting が設定されている (`express-rate-limit`)
- [ ] Helmet.jsでセキュリティヘッダーが設定されている

---

## サポート

問題が発生した場合:

1. Vercel Logs を確認
2. Neon Logs を確認
3. GitHub Issues にバグレポートを作成
4. support@kanjiname.jp にお問い合わせ

---

**作成日**: 2025-09-30
**更新日**: 2026-01-10
**バージョン**: v2.1
