-- ===================================
-- Enable Row Level Security (RLS) for all tables
-- ===================================

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivation_subtypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanji_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanji_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE naming_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE japan_interest_survey ENABLE ROW LEVEL SECURITY;

-- ===================================
-- Reference Data Tables (Read-only for all)
-- ===================================

-- kanji_database: Everyone can read, only service role can modify
CREATE POLICY "kanji_database_select_policy" ON kanji_database
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "kanji_database_all_service" ON kanji_database
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- kanji_combinations: Everyone can read, only service role can modify
CREATE POLICY "kanji_combinations_select_policy" ON kanji_combinations
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "kanji_combinations_all_service" ON kanji_combinations
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ===================================
-- Session-based Tables (Anonymous users)
-- ===================================

-- sessions: Anonymous users can create and read their own sessions
CREATE POLICY "sessions_insert_policy" ON sessions
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "sessions_select_policy" ON sessions
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "sessions_update_policy" ON sessions
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "sessions_all_service" ON sessions
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- answers: Anonymous users can manage their own answers
CREATE POLICY "answers_insert_policy" ON answers
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "answers_select_policy" ON answers
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "answers_update_policy" ON answers
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "answers_delete_policy" ON answers
    FOR DELETE TO anon, authenticated
    USING (true);

CREATE POLICY "answers_all_service" ON answers
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- gender_profiles: Anonymous users can manage their own profiles
CREATE POLICY "gender_profiles_insert_policy" ON gender_profiles
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "gender_profiles_select_policy" ON gender_profiles
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "gender_profiles_update_policy" ON gender_profiles
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "gender_profiles_all_service" ON gender_profiles
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- motivation_scores: Anonymous users can manage their own scores
CREATE POLICY "motivation_scores_insert_policy" ON motivation_scores
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "motivation_scores_select_policy" ON motivation_scores
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "motivation_scores_update_policy" ON motivation_scores
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "motivation_scores_all_service" ON motivation_scores
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- motivation_subtypes: Anonymous users can manage their own subtypes
CREATE POLICY "motivation_subtypes_insert_policy" ON motivation_subtypes
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "motivation_subtypes_select_policy" ON motivation_subtypes
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "motivation_subtypes_update_policy" ON motivation_subtypes
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "motivation_subtypes_all_service" ON motivation_subtypes
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- behavioral_traits: Anonymous users can manage their own traits
CREATE POLICY "behavioral_traits_insert_policy" ON behavioral_traits
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "behavioral_traits_select_policy" ON behavioral_traits
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "behavioral_traits_update_policy" ON behavioral_traits
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "behavioral_traits_all_service" ON behavioral_traits
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- naming_results: Anonymous users can manage their own results
CREATE POLICY "naming_results_insert_policy" ON naming_results
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "naming_results_select_policy" ON naming_results
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "naming_results_all_service" ON naming_results
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- japan_interest_survey: Anonymous users can manage their own surveys
CREATE POLICY "japan_interest_survey_insert_policy" ON japan_interest_survey
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "japan_interest_survey_select_policy" ON japan_interest_survey
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "japan_interest_survey_all_service" ON japan_interest_survey
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ===================================
-- Fix Views (recreate with SECURITY INVOKER)
-- ===================================

-- Drop and recreate views with SECURITY INVOKER
DROP VIEW IF EXISTS popular_kanji_combinations;
DROP VIEW IF EXISTS motivation_kanji_preferences;

-- Recreate popular_kanji_combinations with SECURITY INVOKER
CREATE VIEW popular_kanji_combinations
WITH (security_invoker = true)
AS
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

-- Recreate motivation_kanji_preferences with SECURITY INVOKER
CREATE VIEW motivation_kanji_preferences
WITH (security_invoker = true)
AS
SELECT
    ms.highest_motivation,
    k.kanji_char,
    COUNT(*) as usage_count
FROM naming_results nr
JOIN motivation_scores ms ON nr.session_id = ms.session_id
JOIN kanji_database k ON nr.first_kanji_id = k.kanji_id OR nr.second_kanji_id = k.kanji_id
GROUP BY ms.highest_motivation, k.kanji_char
ORDER BY ms.highest_motivation, usage_count DESC;

-- Grant access to views
GRANT SELECT ON popular_kanji_combinations TO anon, authenticated;
GRANT SELECT ON motivation_kanji_preferences TO anon, authenticated;
