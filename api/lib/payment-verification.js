/**
 * Payment Verification (M-5)
 * 参照: docs/bug-audit-2026-07-13.md M-4 / M-5
 *
 * payment_intent_id を検証し、判定コード（payment_verification）を返す。
 *
 * 最重要原則: 「未払いを弾く」より「正規ユーザーを誤って弾かない」を優先する。
 * 判定に迷う実装分岐は必ず「通してログに残す」側（fail-open）に倒すこと。
 *
 * 正規ユーザーの3系統（クライアントが送る payment_intent_id の形式）:
 *   1. Stripe決済:   'pi_' プレフィックス
 *   2. デモコード:     'DEMO_CODE_<コード>' プレフィックス
 *   3. 決済スキップ:   'skip_payment_test'（REACT_APP_SKIP_PAYMENT==='true' のビルドのみ）
 *
 * この関数群は throw しない。DB/Stripe照会に失敗した場合も fail_open_* を返して
 * 呼び出し元（api/sessions.ts）の処理を継続させる。
 */

const Stripe = require('stripe');
const { getPool } = require('./db');

let stripeClient = null;
let stripeInitError = null;

// Stripeクライアントは遅延初期化する。STRIPE_SECRET_KEY が空/未設定だと
// `new Stripe()` はモジュール読み込み時に同期的にthrowする（実測確認済み）。
// このモジュールは api/sessions.ts のトップレベルからrequireされるため、ここで
// 即時初期化すると決済と無関係なエンドポイント（GET next-question等）まで
// 巻き込んでクラッシュする。呼び出し時まで遅延させ、失敗時もfail_open系に
// 合流させることで「正規ユーザーを誤って弾かない」原則を維持する。
function getStripeClient() {
  if (stripeClient) return stripeClient;
  if (stripeInitError) throw stripeInitError;
  try {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
    return stripeClient;
  } catch (initError) {
    stripeInitError = initError;
    throw initError;
  }
}

const MAX_PAYMENT_INTENT_ID_LENGTH = 100;
const STRIPE_PREFIX = 'pi_';
const DEMO_PREFIX = 'DEMO_CODE_';
const SKIP_VALUE = 'skip_payment_test';

/**
 * sessions.payment_intent_id (VARCHAR(100)) へ安全に保存できる値を返す。
 * 非文字列・空文字・100文字超はNULL扱い（DB制約違反を避けるため）。
 * 形式不正でも100文字以内であれば原文を残す（調査用）。
 */
function toStorableId(rawPaymentIntentId) {
  if (
    typeof rawPaymentIntentId === 'string' &&
    rawPaymentIntentId.length > 0 &&
    rawPaymentIntentId.length <= MAX_PAYMENT_INTENT_ID_LENGTH
  ) {
    return rawPaymentIntentId;
  }
  return null;
}

/**
 * Stripe系統（pi_...）の検証
 * a. payments に status='succeeded' の行があるか（外部通信なし）
 * b. なければ Stripe API に照会
 * c. Stripeが「存在しない」→ rejected_not_found / 存在するがsucceeded以外 → rejected_not_paid
 * d. Stripe API 照会自体が失敗（通信障害・レート制限・5xx・認証エラー等） → fail_open_stripe
 * e. 手順aのDB照会自体が失敗し、bも失敗 → fail_open_db
 */
async function verifyStripePaymentIntent(paymentIntentId) {
  let dbErrored = false;

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id FROM payments WHERE stripe_payment_intent_id = $1 AND status = 'succeeded' LIMIT 1`,
      [paymentIntentId]
    );
    if (result.rows.length > 0) {
      return { code: 'verified_db', system: 'stripe', demoCode: null };
    }
  } catch (dbError) {
    dbErrored = true;
    console.warn('[payment-verification] payments DB lookup failed, falling back to Stripe API:', dbError.message);
  }

  try {
    const stripe = getStripeClient();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent && intent.status === 'succeeded') {
      return { code: 'verified_stripe', system: 'stripe', demoCode: null };
    }
    // Stripe側から明確な「未成功」応答を得られた場合は、DB照会の成否によらずこの判定を採用する
    // （fail-openはあくまで「判定できない」場合のための救済であり、明確な否定には適用しない）。
    return { code: 'rejected_not_paid', system: 'stripe', demoCode: null };
  } catch (stripeError) {
    if (stripeError && stripeError.code === 'resource_missing') {
      return { code: 'rejected_not_found', system: 'stripe', demoCode: null };
    }
    console.warn('[payment-verification] Stripe API lookup failed:', stripeError && stripeError.message);
    return { code: dbErrored ? 'fail_open_db' : 'fail_open_stripe', system: 'stripe', demoCode: null };
  }
}

/**
 * デモ系統（DEMO_CODE_...）の検証
 * 接頭辞を除いたコードで demo_codes を SELECT → 実在すれば verified_demo、不存在なら rejected_demo。
 * 有効期限・使用回数は再チェックしない（適用時点で api/demo/validate.js が消費済みのため、
 * 期限間際の正規ユーザーをここで弾かない）。
 */
async function verifyDemoCode(paymentIntentId) {
  const code = paymentIntentId.slice(DEMO_PREFIX.length);

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id FROM demo_codes WHERE code = $1 LIMIT 1`,
      [code]
    );
    if (result.rows.length > 0) {
      return { code: 'verified_demo', system: 'demo', demoCode: code };
    }
    return { code: 'rejected_demo', system: 'demo', demoCode: code };
  } catch (dbError) {
    // トレース表にデモ系統専用のfail-openコードは定義されていないため、Stripe系統のDB障害用
    // コード（fail_open_db）を意味的に流用する（弾かない側に倒す。ログのprefixで系統は判別可能）。
    console.warn('[payment-verification] demo_codes DB lookup failed, failing open:', dbError.message);
    return { code: 'fail_open_db', system: 'demo', demoCode: code };
  }
}

/**
 * スキップ系統（skip_payment_test）の検証
 * REACT_APP_SKIP_PAYMENT==='true' のビルド/環境でのみ有効。本番はfalseであることを2026-07-14に
 * Vercel CLI（vercel env pull）で実測確認済み。監査時点では未確認扱いだった
 * （docs/bug-audit-2026-07-13.md L-7 および §3）。
 */
function verifySkipPayment() {
  if (process.env.REACT_APP_SKIP_PAYMENT === 'true') {
    return { code: 'verified_skip', system: 'skip', demoCode: null };
  }
  return { code: 'rejected_skip', system: 'skip', demoCode: null };
}

/**
 * payment_intent_id を検証する。
 *
 * @param {unknown} rawPaymentIntentId - req.body.payment_intent_id（型不定・未送信を含む）
 * @returns {Promise<{
 *   code: string,                              // トレース表のpayment_verification値
 *   system: 'stripe'|'demo'|'skip'|null,       // 後処理（紐付け）の分岐に使用
 *   demoCode: string|null,                     // system==='demo'のときの接頭辞除去後コード
 *   storableId: string|null                    // sessions.payment_intent_idへ保存する値
 * }>}
 */
async function verifyPaymentIntent(rawPaymentIntentId) {
  try {
    if (typeof rawPaymentIntentId !== 'string' || rawPaymentIntentId.length === 0) {
      return { code: 'missing', system: null, demoCode: null, storableId: null };
    }

    if (rawPaymentIntentId.length > MAX_PAYMENT_INTENT_ID_LENGTH) {
      return { code: 'rejected_format', system: null, demoCode: null, storableId: null };
    }

    const storableId = toStorableId(rawPaymentIntentId);

    if (rawPaymentIntentId.startsWith(STRIPE_PREFIX)) {
      const result = await verifyStripePaymentIntent(rawPaymentIntentId);
      return { ...result, storableId };
    }

    if (rawPaymentIntentId.startsWith(DEMO_PREFIX)) {
      const result = await verifyDemoCode(rawPaymentIntentId);
      return { ...result, storableId };
    }

    if (rawPaymentIntentId === SKIP_VALUE) {
      return { ...verifySkipPayment(), storableId };
    }

    return { code: 'rejected_format', system: null, demoCode: null, storableId };
  } catch (unexpectedError) {
    // 各分岐の内部try/catchで捕捉されなかった想定外の例外のみここに到達する。
    // 正規ユーザーを誤って弾かない原則により、弾かない側（fail_open_stripe）に倒す。
    console.warn(
      '[payment-verification] unexpected error, failing open:',
      unexpectedError && unexpectedError.message
    );
    return { code: 'fail_open_stripe', system: null, demoCode: null, storableId: null };
  }
}

module.exports = {
  verifyPaymentIntent,
  // テスト・再利用のため個別関数もexport
  toStorableId,
  MAX_PAYMENT_INTENT_ID_LENGTH,
  STRIPE_PREFIX,
  DEMO_PREFIX,
  SKIP_VALUE
};
