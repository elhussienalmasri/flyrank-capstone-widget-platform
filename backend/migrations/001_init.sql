-- 001_init.sql
-- Account / tenant table for the widget provider platform.
-- Each row = one customer account (a "tenant") that will later own widgets.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gives us gen_random_uuid()

CREATE TABLE IF NOT EXISTS tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name   TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup on login
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants (email);
