-- 004_widget_visitors.sql
-- Real visitor accounts for `signup` / `login` widgets. Scoped by
-- TENANT, not widget — so a signup widget and a separate login
-- widget under the same business share one pool of visitors.
-- (Lead-capture `subscribe`/`cta`/`popover` widgets never touch
-- this table — those stay in `submissions`.)

CREATE TABLE IF NOT EXISTS widget_visitors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT,
  email          TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One visitor identity per email per tenant — this is what lets a
-- login widget find the account a signup widget created.
CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_visitors_tenant_email
  ON widget_visitors (tenant_id, email);
