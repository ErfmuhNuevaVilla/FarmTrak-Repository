-- Add disabled column to users table (safe to re-run)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS disabled BOOLEAN NOT NULL DEFAULT false;
