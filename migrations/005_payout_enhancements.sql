-- パートナー支払い機能強化マイグレーション
-- 2026-01-21

-- partner_monthly_stats テーブルに支払い関連カラムを追加
ALTER TABLE partner_monthly_stats
ADD COLUMN IF NOT EXISTS exchange_rate_jpy DECIMAL(10,4),      -- 月末時点のUSD/JPYレート
ADD COLUMN IF NOT EXISTS transfer_fee_jpy INT DEFAULT 0,       -- 振込手数料（円）
ADD COLUMN IF NOT EXISTS net_payout_jpy INT,                   -- 実際の振込金額（円）
ADD COLUMN IF NOT EXISTS payout_notes TEXT;                    -- 支払いメモ

-- コメント追加
COMMENT ON COLUMN partner_monthly_stats.exchange_rate_jpy IS '月末締め時点のUSD/JPY為替レート';
COMMENT ON COLUMN partner_monthly_stats.transfer_fee_jpy IS '銀行振込手数料（円）';
COMMENT ON COLUMN partner_monthly_stats.net_payout_jpy IS '手数料差引後の実際の振込金額（円）';
COMMENT ON COLUMN partner_monthly_stats.payout_notes IS '支払いに関するメモ';
