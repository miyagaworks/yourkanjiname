# 自動レビュー依頼メールシーケンス — 技術設計書

**作成日:** 2026-02-25
**ステータス:** 設計段階

---

## 1. 概要

Stripe購入イベントをトリガーとして、顧客に自動でレビュー依頼メールを送信するシーケンスを構築する。

### メールシーケンス

```
Day 0:   購入 → サンキューページ（SNSシェアボタン）
Day 0-1: 書道デリバリーメール（書道画像 + SNSシェア + Googleレビュー CTA）← 実装済み
Day 5-7: レビュー依頼メール #1（Googleレビュー直リンク + ガイド質問）
Day 14:  レビュー依頼メール #2（未レビュー者のみ。「旅の思い出」切り口）
```

### 前提

- **ホスティング:** Vercel（Serverless Functions + Cron Jobs）
- **メール送信:** Resend API（既存利用中）
- **決済:** Stripe（webhook で `payment_intent.succeeded` を処理中）
- **DB:** PostgreSQL
- **既存Cron:** `/api/cron/save-exchange-rate`（月末実行）

---

## 2. 実装方法の比較

### Option A: Resend + Vercel Cron（推奨）

既存スタックのみで完結。新サービス不要。

| 項目 | 詳細 |
|------|------|
| メール送信 | Resend API（既存利用中） |
| スケジュール | Vercel Cron Jobs（毎日1回実行） |
| データ管理 | PostgreSQL（既存DB） |
| コスト | **$0**（Resend無料枠: 100通/日, 3,000通/月。月間100注文想定なら余裕） |
| 開発工数 | 中。DBテーブル追加 + Cronエンドポイント + メール送信ロジック |

**メリット:**
- 新サービスの契約・連携不要
- 既存のメールテンプレートスタイルをそのまま再利用
- Resendのダッシュボードで開封率・クリック率を確認可能
- Vercel Cron は既に使用実績あり

**デメリット:**
- 配信停止（unsubscribe）機能を自前実装する必要あり
- メールの開封トラッキングはResendが自動提供（追加実装不要）

### Option B: Mailchimp Free

外部マーケティングツールに委任。

| 項目 | 詳細 |
|------|------|
| メール送信 | Mailchimp |
| スケジュール | Mailchimp Automations（Customer Journey） |
| データ管理 | Mailchimp内 |
| コスト | **$0**（Free: 500コンタクト, 1,000通/月） |
| 開発工数 | 中〜高。Stripe→Mailchimpの連携が必要 |

**メリット:**
- ビジュアルエディタでメールを編集可能
- 配信停止管理が組み込み
- A/Bテスト機能

**デメリット:**
- Stripe webhook → Mailchimp API でコンタクト作成の連携コードが必要
- Free版は500コンタクトまで（月100注文なら5ヶ月で上限到達 → 有料$13/月〜）
- Free版はAutomation（Journey）が1つまで
- メールデザインが既存テンプレートと異なる
- レビュー済み顧客の除外がMailchimp内では困難（DB連携が必要）

### Option C: Resend + 自前キューシステム

DBにジョブキューテーブルを作成し、Vercel Cronで処理。

| 項目 | 詳細 |
|------|------|
| メール送信 | Resend API |
| スケジュール | Vercel Cron + DBジョブキュー |
| データ管理 | PostgreSQL |
| コスト | **$0** |
| 開発工数 | 高。汎用的なジョブキューシステムの構築 |

**メリット:**
- 最大の柔軟性
- 将来的に他のメールシーケンス（ウェルカム、NPS調査等）に拡張可能

**デメリット:**
- 現段階ではオーバーエンジニアリング
- レビュー依頼の2通だけに汎用キューは不要

### 推奨: Option A（Resend + Vercel Cron）

**理由:**
1. 新サービス不要（Resendは既に利用中、Vercel Cronも実績あり）
2. コスト$0
3. 月間100注文規模なら十分対応可能
4. レビュー済み顧客の除外をDBで直接制御可能
5. 必要最小限の実装で目的を達成

---

## 3. データベース設計

### 新テーブル: `review_email_queue`

```sql
CREATE TABLE review_email_queue (
    id SERIAL PRIMARY KEY,
    payment_id INT REFERENCES payments(id) ON DELETE CASCADE,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    kanji_name VARCHAR(10) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',

    -- メールシーケンスの状態
    email_day5_scheduled_at TIMESTAMP,      -- Day 5-7 メールの予定日時
    email_day5_sent_at TIMESTAMP,           -- Day 5-7 メールの送信日時
    email_day14_scheduled_at TIMESTAMP,     -- Day 14 メールの予定日時
    email_day14_sent_at TIMESTAMP,          -- Day 14 メールの送信日時

    -- レビュー済みフラグ
    reviewed BOOLEAN DEFAULT FALSE,         -- Googleレビュー済み（手動更新）
    review_clicked BOOLEAN DEFAULT FALSE,   -- レビューリンクをクリックした

    -- 配信停止
    unsubscribed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_review_queue_day5 ON review_email_queue(email_day5_scheduled_at)
    WHERE email_day5_sent_at IS NULL AND unsubscribed = FALSE;
CREATE INDEX idx_review_queue_day14 ON review_email_queue(email_day14_scheduled_at)
    WHERE email_day14_sent_at IS NULL AND unsubscribed = FALSE AND reviewed = FALSE;
CREATE INDEX idx_review_queue_email ON review_email_queue(customer_email);
```

### マイグレーションファイル

`migrations/012_review_email_queue.sql` として作成。

---

## 4. システムアーキテクチャ

### フロー図

```
┌─────────────────────────────────────────────────────┐
│                    Stripe                            │
│  payment_intent.succeeded                           │
└─────────┬───────────────────────────────────────────┘
          │ webhook
          ▼
┌─────────────────────────────────────────────────────┐
│  api/stripe/webhook.js（既存）                       │
│                                                      │
│  1. payments テーブルに記録（既存処理）                │
│  2. review_email_queue にレコード追加 ← NEW          │
│     - email_day5_scheduled_at = NOW() + 5 days       │
│     - email_day14_scheduled_at = NOW() + 14 days     │
└─────────────────────────────────────────────────────┘

          ┌──── 毎日 09:00 UTC (18:00 JST) ────┐
          ▼                                      │
┌─────────────────────────────────────────────────────┐
│  api/cron/send-review-emails.js ← NEW               │
│                                                      │
│  1. Day 5-7 対象を取得:                              │
│     WHERE email_day5_scheduled_at <= NOW()            │
│       AND email_day5_sent_at IS NULL                 │
│       AND unsubscribed = FALSE                       │
│                                                      │
│  2. Day 14 対象を取得:                               │
│     WHERE email_day14_scheduled_at <= NOW()           │
│       AND email_day14_sent_at IS NULL                │
│       AND reviewed = FALSE                           │
│       AND unsubscribed = FALSE                       │
│                                                      │
│  3. Resend API でメール送信                           │
│  4. sent_at を更新                                   │
└─────────────────────────────────────────────────────┘
```

### Vercel Cron 設定

```json
// vercel.json に追加
{
  "crons": [
    {
      "path": "/api/cron/save-exchange-rate",
      "schedule": "0 23 28-31 * *"
    },
    {
      "path": "/api/cron/send-review-emails",
      "schedule": "0 9 * * *"
    }
  ]
}
```

- **実行時間:** 毎日 09:00 UTC = 18:00 JST
- **なぜ18時？:** 旅行者が夕食前にメールをチェックする時間帯。帰国後の顧客は現地時間の朝〜昼に受信

---

## 5. 実装の詳細

### 5-1. Stripe Webhook への追加（`api/stripe/webhook.js`）

`payment_intent.succeeded` のハンドラに、review_email_queue へのレコード追加を組み込む。

```javascript
// payment_intent.succeeded の処理内（既存のpartner stats更新の後）
case 'payment_intent.succeeded': {
  // ... 既存の payments 記録処理 ...

  // NEW: レビューメールキューに追加
  if (wasInserted) {
    const customerEmail = paymentIntent.receipt_email;
    const kanjiName = metadata.kanji_name;

    if (customerEmail && kanjiName) {
      try {
        await dbPool.query(`
          INSERT INTO review_email_queue (
            payment_id, customer_email, kanji_name,
            email_day5_scheduled_at, email_day14_scheduled_at
          ) VALUES (
            $1, $2, $3,
            NOW() + INTERVAL '5 days',
            NOW() + INTERVAL '14 days'
          )
          ON CONFLICT DO NOTHING
        `, [upsertResult.rows[0].id, customerEmail, kanjiName]);
      } catch (err) {
        console.error('Failed to queue review email:', err.message);
        // メール送信失敗は決済処理を止めない
      }
    }
  }
  break;
}
```

**注意点:**
- `customer_name` と `language` は calligraphy_requests テーブルから取得可能（emailで結合）
- 決済時点では `kanji_name` は metadata に含まれるが、`user_name` は含まれない場合がある
- Cronジョブ実行時に calligraphy_requests と JOIN して取得する方が確実

### 5-2. Cron エンドポイント（`api/cron/send-review-emails.js`）

```javascript
// api/cron/send-review-emails.js
module.exports = async function handler(req, res) {
  // Vercel Cron認証チェック
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const dbPool = getPool();

  // Day 5-7 メール対象を取得
  const day5Targets = await dbPool.query(`
    SELECT q.*, cr.user_name, cr.language
    FROM review_email_queue q
    LEFT JOIN calligraphy_requests cr ON cr.email = q.customer_email
      AND cr.kanji_name = q.kanji_name
    WHERE q.email_day5_scheduled_at <= NOW()
      AND q.email_day5_sent_at IS NULL
      AND q.unsubscribed = FALSE
    ORDER BY q.email_day5_scheduled_at ASC
    LIMIT 50
  `);

  // Day 14 メール対象を取得
  const day14Targets = await dbPool.query(`
    SELECT q.*, cr.user_name, cr.language
    FROM review_email_queue q
    LEFT JOIN calligraphy_requests cr ON cr.email = q.customer_email
      AND cr.kanji_name = q.kanji_name
    WHERE q.email_day14_scheduled_at <= NOW()
      AND q.email_day14_sent_at IS NULL
      AND q.reviewed = FALSE
      AND q.unsubscribed = FALSE
    ORDER BY q.email_day14_scheduled_at ASC
    LIMIT 50
  `);

  // メール送信 + sent_at 更新
  // ...（テンプレートファイルを読み込み、プレースホルダーを置換して送信）
};
```

### 5-3. レビュー済み顧客の除外ロジック

Googleレビューの自動検知はGoogle API制限により困難。以下の方法で管理する。

**方法1: 管理画面での手動マーク（推奨・初期実装）**

```
Admin Dashboard → 書道申込タブ → レビュー済みチェックボックス
```

- 管理者がGoogle Business Profileでレビューを確認し、該当顧客をマーク
- `review_email_queue.reviewed = TRUE` に更新
- Day 14 メールが自動的にスキップされる

**方法2: レビューリンクのクリックトラッキング（Phase B以降）**

メール内のGoogleレビューリンクをリダイレクト経由にする:

```
https://app.kanjiname.jp/api/track/review-click?id={queue_id}
  → review_clicked = TRUE に更新
  → https://g.page/r/Cft5gcCZVQfoEAI/review にリダイレクト
```

- クリック = レビューを書いた可能性が高い
- クリック後は Day 14 メールを送信しない
- 100%正確ではないが、重複依頼の大部分を防げる

**方法3: Google Business Profile API（将来的）**

- GBP API でレビュー一覧を取得し、メールアドレスまたは名前でマッチング
- ただしGBP APIのレビュー取得にはreviewerのメールは含まれず、名前のみ
- 精度が低いため、初期実装では不要

### 5-4. 配信停止（Unsubscribe）

Resendの組み込みunsubscribe機能を活用:

```javascript
// Resend API でメール送信時
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({
    from: fromEmail,
    to: customerEmail,
    subject: subject,
    html: html,
    headers: {
      'List-Unsubscribe': '<mailto:unsubscribe@kanjiname.jp>'
    }
  })
});
```

加えて、メールフッターにunsubscribeリンクを配置:

```
https://app.kanjiname.jp/api/unsubscribe?email={encoded_email}&token={hmac_token}
```

- HMACトークンで改ざん防止
- `review_email_queue.unsubscribed = TRUE` に更新

---

## 6. ファイル構成

```
api/
├── cron/
│   ├── save-exchange-rate.js    （既存）
│   └── send-review-emails.js    ← NEW: Cronジョブ本体
├── stripe/
│   └── webhook.js               ← 変更: キュー追加処理
├── track/
│   └── review-click.js          ← NEW: クリックトラッキング
├── unsubscribe.js               ← NEW: 配信停止処理
│
templates/emails/
├── review-request-personal.html  （タスク1で作成済み）
├── review-request-day5.html      （タスク1で作成済み）
└── review-reminder-day14.html    （タスク1で作成済み）
│
migrations/
└── 012_review_email_queue.sql    ← NEW: DBマイグレーション
```

---

## 7. 実装ステップ（優先順位順）

### Step 1: DB + Webhook（所要: 1-2時間）
1. `012_review_email_queue.sql` マイグレーション作成・実行
2. `api/stripe/webhook.js` にキュー追加処理を組み込み

### Step 2: Cronジョブ（所要: 2-3時間）
1. `api/cron/send-review-emails.js` 作成
2. テンプレートのプレースホルダー置換ロジック
3. `vercel.json` にcron設定追加
4. `CRON_SECRET` 環境変数を設定

### Step 3: クリックトラッキング（所要: 1時間）
1. `api/track/review-click.js` 作成
2. テンプレートのレビューリンクをトラッキングURL経由に変更

### Step 4: 配信停止（所要: 1時間）
1. `api/unsubscribe.js` 作成
2. テンプレートのフッターにunsubscribeリンク追加

### Step 5: 管理画面（所要: 1-2時間）
1. Admin.js に「レビュー管理」タブまたは書道申込タブ内にレビュー状態表示を追加
2. レビュー済みマーク機能

---

## 8. Resend 無料枠の確認

| 項目 | Free プラン | 想定使用量（月間100注文） |
|------|------------|------------------------|
| 日別送信上限 | 100通/日 | 最大 ~7通/日（Day5 + Day14） |
| 月別送信上限 | 3,000通/月 | ~200通/月（レビュー系のみ） |
| カスタムドメイン | 1ドメイン | kanjiname.jp（既存設定済み） |
| Webhook（開封・クリック） | あり | 利用可能 |

**結論:** 月間500注文まで無料枠内で対応可能。十分な余裕あり。

---

## 9. メトリクス・KPI

Cronジョブ実行時にログに記録し、月次で集計する:

| メトリクス | 取得方法 |
|-----------|---------|
| Day 5-7 メール送信数 | `email_day5_sent_at IS NOT NULL` のCOUNT |
| Day 14 メール送信数 | `email_day14_sent_at IS NOT NULL` のCOUNT |
| レビュークリック率 | `review_clicked = TRUE` / 送信数 |
| レビュー済み率 | `reviewed = TRUE` / 送信数 |
| 配信停止率 | `unsubscribed = TRUE` / 全レコード数 |
| Day 14 スキップ率 | Day 14 スキップ数 / Day 5-7 送信数 |

**目標:**
- Day 5-7 メールからのレビュークリック率: 15-25%
- Day 14 追加分: 5-10%
- 配信停止率: < 2%
