# パートナーアフィリエイトシステム実装計画

## 概要

広島のお好み焼き屋さん向けのアフィリエイトシステムを実装。QRコードからの利用者を追跡し、売上の10%をロイヤリティとして還元する仕組み。

**主要仕様:**
- 利用料: $5（名前生成時にStripe決済）
- ロイヤリティ: デフォルト10%（$0.50/件）、店舗ごとに変更可能
- 支払い: 手動振込（管理画面で金額確認→銀行振込）

---

## 1. データベース追加（新規テーブル）

### `partners` - パートナー店舗情報
```sql
CREATE TABLE partners (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,        -- URLコード（例: okonomiyaki-hiroshima）
    name VARCHAR(255) NOT NULL,              -- 店舗名
    email VARCHAR(255) NOT NULL UNIQUE,      -- ログイン用メール
    password_hash VARCHAR(255) NOT NULL,     -- bcryptハッシュ
    contact_name VARCHAR(255),               -- 担当者名
    phone VARCHAR(50),
    address TEXT,
    bank_name VARCHAR(100),                  -- 振込先銀行
    bank_account VARCHAR(100),               -- 口座番号
    royalty_rate DECIMAL(5,4) DEFAULT 0.10,  -- ロイヤリティ率
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### `payments` - 決済記録
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(session_id),
    stripe_payment_intent_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,           -- $5.00
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(20) NOT NULL,             -- 'pending','succeeded','failed','refunded'
    partner_code VARCHAR(20),                -- 紹介コード
    partner_id INT REFERENCES partners(id),
    customer_email VARCHAR(255),
    kanji_name VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### `partner_monthly_stats` - 月次集計
```sql
CREATE TABLE partner_monthly_stats (
    id SERIAL PRIMARY KEY,
    partner_id INT REFERENCES partners(id) ON DELETE CASCADE,
    year_month VARCHAR(7) NOT NULL,          -- 'YYYY-MM'
    total_payments INT DEFAULT 0,            -- 件数
    total_revenue DECIMAL(10,2) DEFAULT 0,   -- 売上
    royalty_amount DECIMAL(10,2) DEFAULT 0,  -- ロイヤリティ
    payout_status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP,
    UNIQUE(partner_id, year_month)
);
```

---

## 2. API エンドポイント

### Stripe関連
| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/stripe/create-payment-intent` | POST | 決済Intent作成 |
| `/api/stripe/webhook` | POST | Stripe webhook受信 |

### パートナー用
| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/partner/login` | POST | ログイン |
| `/api/partner/dashboard` | GET | ダッシュボードデータ |
| `/api/partner/profile` | GET/PUT | プロフィール表示・更新 |

### 管理者用（既存の`/api/admin`を拡張）
| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/admin/partners` | GET/POST | パートナー一覧・作成 |
| `/api/admin/partners/[id]` | GET/PUT/DELETE | パートナー詳細・編集・削除 |
| `/api/admin/payments` | GET | 決済一覧 |
| `/api/admin/payouts` | GET/POST | 支払い管理・支払い済み登録 |
| `/api/admin/stats` | GET | 売上統計 |

---

## 3. フロントエンド

### 新規ページ
| パス | コンポーネント | 説明 |
|-----|---------------|------|
| `/partner` | `PartnerLogin.js` | パートナーログイン |
| `/partner/dashboard` | `PartnerDashboard.js` | パートナーマイページ |

### 新規コンポーネント
| ファイル | 説明 |
|---------|------|
| `PaymentModal.js` | Stripe決済モーダル |
| `AdminPartners.js` | 管理者用パートナー管理 |
| `AdminPayments.js` | 管理者用決済一覧 |
| `AdminPayouts.js` | 管理者用支払い管理 |

### 既存ファイルの修正
| ファイル | 変更内容 |
|---------|---------|
| `App.js` | URLから`?ref=CODE`を取得、決済モーダル追加 |
| `Admin.js` | タブ追加（Partners/Payments/Payouts） |

---

## 4. 実装フロー

### フェーズ1: データベース・基盤
1. マイグレーションファイル作成 `migrations/004_partner_system.sql`
2. 開発環境でテーブル作成
3. bcryptパッケージ追加

### フェーズ2: Stripe決済
1. Stripeパッケージ追加（backend: `stripe`, frontend: `@stripe/react-stripe-js`）
2. `/api/stripe/create-payment-intent.js` 作成
3. `/api/stripe/webhook.js` 作成
4. `PaymentModal.js` コンポーネント作成
5. `App.js` に決済フロー統合

### フェーズ3: パートナーポータル
1. `/api/partner/login.js` 作成
2. `/api/partner/dashboard.js` 作成
3. `PartnerLogin.js` ページ作成
4. `PartnerDashboard.js` ページ作成

### フェーズ4: 管理者機能拡張
1. `/api/admin/partners.js` 作成
2. `/api/admin/payments.js` 作成
3. `/api/admin/payouts.js` 作成
4. `Admin.js` にタブナビゲーション追加
5. 各管理コンポーネント作成

### フェーズ5: テスト・デプロイ
1. Stripeテストモードで検証
2. Vercelに環境変数設定
3. Webhook URL設定
4. 本番デプロイ

---

## 5. 主要ファイル一覧

### 新規作成
```
migrations/004_partner_system.sql
api/stripe/create-payment-intent.js
api/stripe/webhook.js
api/partner/login.js
api/partner/dashboard.js
api/admin/partners.js
api/admin/payments.js
api/admin/payouts.js
frontend/src/components/PaymentModal.js
frontend/src/components/PaymentModal.css
frontend/src/pages/PartnerLogin.js
frontend/src/pages/PartnerDashboard.js
frontend/src/pages/PartnerDashboard.css
frontend/src/AdminPartners.js
frontend/src/AdminPayments.js
frontend/src/AdminPayouts.js
```

### 修正
```
frontend/src/App.js          - 決済フロー統合、パートナーコード追跡
frontend/src/Admin.js        - タブナビゲーション追加
frontend/package.json        - Stripe, qrcode.react追加
package.json                 - stripe, bcrypt追加
```

---

## 6. 環境変数（追加）

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 7. 検証方法

1. **決済テスト**: Stripeテストカード `4242 4242 4242 4242` で決済
2. **パートナー追跡**: `?ref=test-partner` でアクセスし決済後、パートナーに紐付くか確認
3. **ダッシュボード確認**: パートナーログイン後、ロイヤリティが表示されるか確認
4. **管理画面確認**: 管理者ログイン後、売上・支払い管理が機能するか確認
