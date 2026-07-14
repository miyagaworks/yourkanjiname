-- Add user-selected-language explanation/meaning fields to naming_results
-- Needed so non-en/ja users (fr/de/es/it/th/vi/id/ko) see the explanation and
-- kanji meanings in their own language instead of always falling back to English.
-- All columns are nullable additions; existing rows and existing code are unaffected.
ALTER TABLE naming_results
  ADD COLUMN IF NOT EXISTS explanation_user TEXT,
  ADD COLUMN IF NOT EXISTS first_kanji_meaning_user TEXT,
  ADD COLUMN IF NOT EXISTS second_kanji_meaning_user TEXT,
  ADD COLUMN IF NOT EXISTS result_language VARCHAR(10);
