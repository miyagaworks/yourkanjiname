-- Add unique constraint on stripe_payment_intent_id for idempotent webhook processing
-- This prevents duplicate payment records from concurrent webhooks

-- First, remove any duplicate records (keep the first one)
DELETE FROM payments a USING payments b
WHERE a.id > b.id
  AND a.stripe_payment_intent_id = b.stripe_payment_intent_id
  AND a.stripe_payment_intent_id IS NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_intent_unique
ON payments(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Add updated_at column if not exists
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
