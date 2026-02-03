-- FarmTrak schema (minimal auth)

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'manager', 'worker')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

