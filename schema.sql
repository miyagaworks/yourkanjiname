-- ===================================
-- YourKanjiName Database Schema
-- 新システム用データベース設計
-- ===================================

-- ユーザーセッション管理
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(100), -- ユーザーのフルネーム
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE,
    result_kanji_name VARCHAR(2),
    ip_address INET,
    user_agent TEXT
);

-- 回答記録
CREATE TABLE answers (
    answer_id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    question_id VARCHAR(20) NOT NULL, -- 'Q1', 'Q6', 'M-1', 'Q10-knowledge-A' など
    answer_option VARCHAR(50) NOT NULL, -- 'A', 'B', 'C', 'D', 'E', 'F' または新システムのID ('curious_explorer'など)
    answered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, question_id)
);

CREATE INDEX idx_answers_session ON answers(session_id);

-- 性別申告と性質スコア
CREATE TABLE gender_profiles (
    session_id UUID PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
    declared_gender VARCHAR(20) NOT NULL, -- 'male', 'female', 'nonbinary', 'prefer_not_to_say'
    gender_trait_score INT NOT NULL DEFAULT 0, -- 性別性質スコア(-10〜+10)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6つの根源的動機スコア
CREATE TABLE motivation_scores (
    session_id UUID PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
    knowledge_desire INT NOT NULL DEFAULT 0, -- 知識欲
    creative_desire INT NOT NULL DEFAULT 0,  -- 創造欲
    belonging_desire INT NOT NULL DEFAULT 0, -- 所属欲
    dominance_desire INT NOT NULL DEFAULT 0, -- 支配欲
    stability_desire INT NOT NULL DEFAULT 0, -- 安定欲
    freedom_desire INT NOT NULL DEFAULT 0,   -- 自由欲
    highest_motivation VARCHAR(20), -- 最高スコアの動機
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 動機の3分類スコア
CREATE TABLE motivation_subtypes (
    session_id UUID PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
    motivation_type VARCHAR(20) NOT NULL, -- 'knowledge', 'creative', 'belonging', など
    subtype_a_score INT NOT NULL DEFAULT 0,
    subtype_b_score INT NOT NULL DEFAULT 0,
    subtype_c_score INT NOT NULL DEFAULT 0,
    highest_subtype VARCHAR(30), -- 例: 'truth_seeking', 'pure_creation', など
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 行動特性スコア（新規追加）
CREATE TABLE behavioral_traits (
    session_id UUID PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
    decisiveness_score INT NOT NULL DEFAULT 0, -- 決断力スコア (-4〜+6: Q6+Q10)
    action_oriented_score INT NOT NULL DEFAULT 0, -- 行動志向スコア (-2〜+3: Q7)
    consistency_score INT NOT NULL DEFAULT 0, -- 一貫性スコア (-2〜+3: Q8)
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 漢字データベース
CREATE TABLE kanji_database (
    kanji_id SERIAL PRIMARY KEY,
    kanji_char CHAR(1) NOT NULL UNIQUE,
    meaning_en TEXT NOT NULL,
    meaning_ja TEXT NOT NULL,
    pronunciation_on TEXT[], -- 音読み配列
    pronunciation_kun TEXT[], -- 訓読み配列

    -- 性別適合性
    gender_category VARCHAR(30) NOT NULL, -- 'strong_masculine', 'soft_masculine', 'feminine', 'modern_feminine', 'neutral'
    masculinity_score INT NOT NULL, -- -10(女性的) 〜 +10(男性的)

    -- 動機カテゴリとの適合性
    knowledge_affinity INT DEFAULT 0,
    creative_affinity INT DEFAULT 0,
    belonging_affinity INT DEFAULT 0,
    dominance_affinity INT DEFAULT 0,
    stability_affinity INT DEFAULT 0,
    freedom_affinity INT DEFAULT 0,

    -- 細分化タイプとの適合性(JSON)
    subtype_affinities JSONB, -- {"truth_seeking": 8, "learning_growth": 5, ...}

    -- メタデータ
    jlpt_level INT, -- 1-5
    frequency_rank INT, -- 使用頻度ランキング
    stroke_count INT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kanji_gender ON kanji_database(gender_category);
CREATE INDEX idx_kanji_masculinity ON kanji_database(masculinity_score);
CREATE INDEX idx_kanji_affinities ON kanji_database USING gin(subtype_affinities);

-- 漢字組み合わせルール
CREATE TABLE kanji_combinations (
    combination_id SERIAL PRIMARY KEY,
    first_kanji_id INT NOT NULL REFERENCES kanji_database(kanji_id),
    second_kanji_id INT NOT NULL REFERENCES kanji_database(kanji_id),

    -- 適合性スコア
    harmony_score INT NOT NULL, -- 組み合わせの調和度(1-10)
    meaning_coherence INT NOT NULL, -- 意味の一貫性(1-10)
    sound_quality INT NOT NULL, -- 音の響き(1-10)

    -- 推奨条件
    recommended_gender VARCHAR(30), -- NULL = 全性別OK
    recommended_motivation VARCHAR(20), -- NULL = 全動機OK

    -- メタデータ
    example_usage TEXT, -- 使用例・説明
    cultural_notes TEXT, -- 文化的背景

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(first_kanji_id, second_kanji_id)
);

CREATE INDEX idx_combinations_gender ON kanji_combinations(recommended_gender);
CREATE INDEX idx_combinations_motivation ON kanji_combinations(recommended_motivation);

-- 最終結果記録
CREATE TABLE naming_results (
    result_id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,

    -- 選択された漢字
    first_kanji_id INT REFERENCES kanji_database(kanji_id), -- NULLable for AI-generated
    second_kanji_id INT REFERENCES kanji_database(kanji_id), -- NULLable for AI-generated
    kanji_name VARCHAR(2) NOT NULL,

    -- AI生成用の漢字詳細（データベースにない漢字の場合）
    first_kanji_char CHAR(1),
    second_kanji_char CHAR(1),
    first_kanji_meaning_ja TEXT,
    first_kanji_meaning_en TEXT,
    second_kanji_meaning_ja TEXT,
    second_kanji_meaning_en TEXT,

    -- スコアリング詳細
    matching_score INT NOT NULL, -- 総合マッチングスコア(1-100)
    gender_match_score INT NOT NULL,
    motivation_match_score INT NOT NULL,
    subtype_match_score INT NOT NULL,

    -- 説明文
    explanation_en TEXT NOT NULL,
    explanation_ja TEXT NOT NULL,

    -- メタデータ
    generation_algorithm_version VARCHAR(10) DEFAULT 'v2.0', -- v2.0 = AI生成
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_naming_results_session ON naming_results(session_id);
CREATE INDEX idx_naming_results_kanji ON naming_results(first_kanji_id, second_kanji_id);

-- 統計・分析用ビュー
CREATE VIEW popular_kanji_combinations AS
SELECT
    k1.kanji_char as first_kanji,
    k2.kanji_char as second_kanji,
    COUNT(*) as usage_count,
    AVG(nr.matching_score) as avg_matching_score
FROM naming_results nr
JOIN kanji_database k1 ON nr.first_kanji_id = k1.kanji_id
JOIN kanji_database k2 ON nr.second_kanji_id = k2.kanji_id
GROUP BY k1.kanji_char, k2.kanji_char
ORDER BY usage_count DESC;

-- 動機別人気漢字
CREATE VIEW motivation_kanji_preferences AS
SELECT
    ms.highest_motivation,
    k.kanji_char,
    COUNT(*) as usage_count
FROM naming_results nr
JOIN motivation_scores ms ON nr.session_id = ms.session_id
JOIN kanji_database k ON nr.first_kanji_id = k.kanji_id OR nr.second_kanji_id = k.kanji_id
GROUP BY ms.highest_motivation, k.kanji_char
ORDER BY ms.highest_motivation, usage_count DESC;

-- 日本への興味アンケート(バックエンド用)
CREATE TABLE japan_interest_survey (
    session_id UUID PRIMARY KEY REFERENCES sessions(session_id) ON DELETE CASCADE,
    interest_trigger TEXT[], -- 複数選択可能
    desired_experience TEXT[], -- 複数選択可能
    additional_comments TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_sessions_completed ON sessions(completed);
CREATE INDEX idx_sessions_created ON sessions(created_at);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanji_updated_at BEFORE UPDATE ON kanji_database
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 初期データ投入用コメント
-- ===================================

-- 漢字データは別途 seed_kanji.sql で投入
-- 質問データは JSON ファイルで管理 (questions.json)