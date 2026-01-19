-- ===================================
-- Partner Affiliate System Tables
-- パートナーアフィリエイトシステム
-- ===================================

-- パートナー店舗情報
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
    royalty_rate DECIMAL(5,4) DEFAULT 0.10,  -- ロイヤリティ率（デフォルト10%）
    status VARCHAR(20) DEFAULT 'active',     -- 'active', 'inactive', 'suspended'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_partners_code ON partners(code);
CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_status ON partners(status);

-- 決済記録
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,           -- 金額（例: 5.00）
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(20) NOT NULL,             -- 'pending','succeeded','failed','refunded'
    partner_code VARCHAR(20),                -- 紹介コード
    partner_id INT REFERENCES partners(id) ON DELETE SET NULL,
    customer_email VARCHAR(255),
    kanji_name VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_payments_session ON payments(session_id);
CREATE INDEX idx_payments_partner ON payments(partner_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- パートナー月次集計
CREATE TABLE partner_monthly_stats (
    id SERIAL PRIMARY KEY,
    partner_id INT REFERENCES partners(id) ON DELETE CASCADE,
    year_month VARCHAR(7) NOT NULL,          -- 'YYYY-MM'
    total_payments INT DEFAULT 0,            -- 件数
    total_revenue DECIMAL(10,2) DEFAULT 0,   -- 売上
    royalty_amount DECIMAL(10,2) DEFAULT 0,  -- ロイヤリティ
    payout_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid'
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(partner_id, year_month)
);

-- インデックス作成
CREATE INDEX idx_partner_stats_partner ON partner_monthly_stats(partner_id);
CREATE INDEX idx_partner_stats_month ON partner_monthly_stats(year_month);
CREATE INDEX idx_partner_stats_payout ON partner_monthly_stats(payout_status);

-- RLSを有効化
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_monthly_stats ENABLE ROW LEVEL SECURITY;

-- ポリシー設定（Service roleが全アクセス）
CREATE POLICY "partners_all_service" ON partners
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "payments_all_service" ON payments
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "partner_stats_all_service" ON partner_monthly_stats
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Anonymous/authenticated users can read partners (for code lookup)
CREATE POLICY "partners_select_anon" ON partners
    FOR SELECT TO anon, authenticated
    USING (status = 'active');

-- Anonymous users can insert payments
CREATE POLICY "payments_insert_anon" ON payments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- 更新日時自動更新トリガー
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON partners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_stats_updated_at BEFORE UPDATE ON partner_monthly_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- パートナー売上集計ビュー
CREATE VIEW partner_revenue_summary AS
SELECT
    p.id as partner_id,
    p.code,
    p.name,
    p.royalty_rate,
    COUNT(pay.id) as total_payments,
    COALESCE(SUM(pay.amount), 0) as total_revenue,
    COALESCE(SUM(pay.amount * p.royalty_rate), 0) as total_royalty
FROM partners p
LEFT JOIN payments pay ON p.id = pay.partner_id AND pay.status = 'succeeded'
GROUP BY p.id, p.code, p.name, p.royalty_rate;
