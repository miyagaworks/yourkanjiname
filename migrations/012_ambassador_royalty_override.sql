-- Add ambassador royalty override to partners table
-- NULL = use ambassador's default rate, value = override rate for this partner
ALTER TABLE partners ADD COLUMN ambassador_royalty_override DECIMAL(5,4) DEFAULT NULL;
