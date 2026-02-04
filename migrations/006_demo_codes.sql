-- Demo codes for partner presentations and testing
-- Allows secure, time-limited, trackable free access without redeployment

CREATE TABLE IF NOT EXISTS demo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  description VARCHAR(255),
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Index for quick code lookups
CREATE INDEX IF NOT EXISTS idx_demo_codes_code ON demo_codes(code);
CREATE INDEX IF NOT EXISTS idx_demo_codes_active ON demo_codes(is_active, expires_at);

-- Usage log for tracking who used which code
CREATE TABLE IF NOT EXISTS demo_code_usage (
  id SERIAL PRIMARY KEY,
  demo_code_id INTEGER REFERENCES demo_codes(id),
  session_id UUID,
  used_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_demo_code_usage_code ON demo_code_usage(demo_code_id);
