-- Migration 009: Salesperson System
-- Adds salesperson management for partner referrals with time-limited royalties

-- Create salespersons table
CREATE TABLE IF NOT EXISTS salespersons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  royalty_rate DECIMAL(5,4) DEFAULT 0.10,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add salesperson reference to partners
ALTER TABLE partners ADD COLUMN IF NOT EXISTS salesperson_id INTEGER REFERENCES salespersons(id);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS salesperson_contract_start DATE;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS salesperson_contract_months INTEGER DEFAULT 12;

-- Create salesperson monthly stats table
CREATE TABLE IF NOT EXISTS salesperson_monthly_stats (
  id SERIAL PRIMARY KEY,
  salesperson_id INTEGER REFERENCES salespersons(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  total_payments INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  royalty_amount DECIMAL(10,2) DEFAULT 0,
  payout_status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMP,
  exchange_rate_jpy DECIMAL(10,4),
  transfer_fee_jpy INTEGER,
  net_payout_jpy INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(salesperson_id, year_month)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_salespersons_email ON salespersons(email);
CREATE INDEX IF NOT EXISTS idx_salespersons_code ON salespersons(code);
CREATE INDEX IF NOT EXISTS idx_salesperson_monthly_stats_salesperson_id ON salesperson_monthly_stats(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_partners_salesperson_id ON partners(salesperson_id);
