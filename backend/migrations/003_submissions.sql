-- 003_submissions.sql
-- Submissions table. Every row is a visitor's form
-- submission, linked to both the widget and (denormalized) its
-- tenant, so dashboard queries don't need a join for the common case.

CREATE TABLE IF NOT EXISTS submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id      UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fields         JSONB NOT NULL,                 -- the visitor's submitted form data
  ip_address     TEXT,
  geo_country    TEXT,
  geo_city       TEXT,
  geo_provider   TEXT,                           -- which provider answered ('ip-api' | 'ipapi.co' | null)
  notified       BOOLEAN NOT NULL DEFAULT false,  -- did the side-effect (email/webhook) succeed
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_widget_id ON submissions (widget_id);
CREATE INDEX IF NOT EXISTS idx_submissions_tenant_id ON submissions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions (created_at);
