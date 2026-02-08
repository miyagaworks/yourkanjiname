-- Migration 011: Exchange rates storage
-- Store month-end exchange rates for payout calculations

CREATE TABLE IF NOT EXISTS exchange_rates (
  year_month VARCHAR(7) PRIMARY KEY,  -- e.g., '2025-01'
  usd_jpy DECIMAL(10,4) NOT NULL,
  rate_date DATE NOT NULL,            -- The date the rate was fetched for
  fetched_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'ECB (Frankfurter API)'
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_year_month ON exchange_rates(year_month);
