-- Add role to existing installations (safe to re-run)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'worker'
  CHECK (role IN ('admin', 'manager', 'worker'));

