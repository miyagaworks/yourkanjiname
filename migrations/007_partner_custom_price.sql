-- Add custom price per partner
-- Allows partners to set different service prices (default $5.00)

ALTER TABLE partners ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2) DEFAULT 5.00;

-- Update existing partners to have the default price
UPDATE partners SET price_usd = 5.00 WHERE price_usd IS NULL;
