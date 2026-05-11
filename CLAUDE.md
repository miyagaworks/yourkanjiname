# Your Kanji Name - プロジェクト設定

## ビルドコマンド

```bash
cd /Users/miyagawakiyomi/Projects/kanjiname/frontend && REACT_APP_API_URL=/api npm run build
```

## プロジェクト構成

- `frontend/` — React フロントエンド（Vercel でデプロイ）
- `frontend/src/App.js` — メインアプリケーション
- `frontend/src/App.css` — メインCSS
- `frontend/src/locales/index.js` — 11言語の翻訳（en, fr, de, es, pt, it, th, vi, id, ko, ja）
- `frontend/src/components/PaymentModal.js` — Stripe決済

## 翻訳

- 全UIテキストは `locales/index.js` で管理
- 新しいテキストを追加する場合は全11言語に翻訳を追加すること
- JSXでは `t('key')` を使用、ハードコードしない
