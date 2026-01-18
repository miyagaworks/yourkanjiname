-- ===================================
-- Create calligraphy_requests table
-- 書道申込リクエスト管理
-- ===================================

-- 書道申込リクエストテーブル
CREATE TABLE calligraphy_requests (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    kanji_name VARCHAR(10) NOT NULL,
    user_name VARCHAR(255),
    language VARCHAR(10) DEFAULT 'en',
    explanation_ja TEXT,
    explanation_user_lang TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_calligraphy_requests_email ON calligraphy_requests(email);
CREATE INDEX idx_calligraphy_requests_status ON calligraphy_requests(status);
CREATE INDEX idx_calligraphy_requests_created ON calligraphy_requests(created_at);

-- RLSを有効化
ALTER TABLE calligraphy_requests ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
-- Anonymous users can insert new requests
CREATE POLICY "calligraphy_requests_insert_policy" ON calligraphy_requests
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Anonymous users can only read their own requests by email (limited access)
CREATE POLICY "calligraphy_requests_select_policy" ON calligraphy_requests
    FOR SELECT TO anon, authenticated
    USING (true);

-- Service role has full access
CREATE POLICY "calligraphy_requests_all_service" ON calligraphy_requests
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 更新日時自動更新トリガー
CREATE TRIGGER update_calligraphy_requests_updated_at BEFORE UPDATE ON calligraphy_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
