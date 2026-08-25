-- 009_pending_widget_visitors.sql
-- Same staging pattern, but for `signup` widgets that have the
-- per-widget "require email verification" checkbox turned on. No
-- widget_visitors row is created until the link is clicked.

CREATE TABLE IF NOT EXISTS pending_widget_visitors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  widget_id             UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  name                  TEXT,
  email                 TEXT NOT NULL,
  password_hash         TEXT NOT NULL,
  verification_token    TEXT NOT NULL,
  verification_expires  TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Matches the same (tenant_id, email) uniqueness the real
-- widget_visitors table enforces, so a pending signup can't
-- conflict with an account that already fully exists.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_widget_visitors_tenant_email
  ON pending_widget_visitors (tenant_id, email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_widget_visitors_token
  ON pending_widget_visitors (verification_token);
