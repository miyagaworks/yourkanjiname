-- 決済とセッション/書道申込の紐付け（M-4）＋ サーバー側決済チェック（M-5）のための列追加
-- 参照: docs/bug-audit-2026-07-13.md M-4, M-5
--
-- payments.session_id は既存（migrations/004_partner_system.sql）だが webhook 到達時点で
-- metadata.session_id が常に空のため実質的に埋まらない（M-4 の根本原因）。本migrationでは
-- 逆方向（sessions → payment_intent_id）の紐付けを追加し、api/sessions.ts の決済検証で
-- 判定結果を記録できるようにする。
--
-- 全列 NULL 許容の追加のみ。既存行・既存コードへの影響なし（ALTER TABLE ADD COLUMN のみ、
-- DROP・型変更は含めない）。

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_verification VARCHAR(30);

-- webhook（payment_intent.succeeded）からの session_id 逆引き用
CREATE INDEX IF NOT EXISTS idx_sessions_payment_intent_id ON sessions(payment_intent_id);

-- 書道申込（api/calligrapher-request.js）が payment_intent_id / partner_code を
-- 破棄していた問題（M-4）の解消用
ALTER TABLE calligraphy_requests
  ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS partner_code VARCHAR(20);
