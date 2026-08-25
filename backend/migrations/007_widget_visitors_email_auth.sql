-- 007_widget_visitors_email_auth.sql
-- Same email verification + password reset support, but for
-- WIDGET VISITORS (signup-widget accounts). Off by default per
-- widget — the owner opts in via a checkbox on that specific
-- `signup` widget (stored in widgets.display_options.emailVerificationEnabled).

ALTER TABLE widget_visitors
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_visitors_verification_token
  ON widget_visitors (email_verification_token) WHERE email_verification_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_visitors_reset_token
  ON widget_visitors (password_reset_token) WHERE password_reset_token IS NOT NULL;
