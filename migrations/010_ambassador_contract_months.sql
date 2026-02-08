-- Migration 010: Add contract_months to ambassadors (salespersons)
-- Each ambassador has a default contract period that applies to their referred partners

ALTER TABLE salespersons ADD COLUMN IF NOT EXISTS contract_months INTEGER DEFAULT 12;

-- Update existing records to have default 12 months
UPDATE salespersons SET contract_months = 12 WHERE contract_months IS NULL;
