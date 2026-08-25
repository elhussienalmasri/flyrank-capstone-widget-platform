-- 006_tenant_email_auth.sql
-- Adds email verification + password reset support for platform
-- OWNER accounts (tenants). Controlled by EMAIL_FEATURES_ENABLED
-- (default: enabled) — see src/config/env.js.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_verification_token
  ON tenants (email_verification_token) WHERE email_verification_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_reset_token
  ON tenants (password_reset_token) WHERE password_reset_token IS NOT NULL;
