-- 002_widgets.sql
-- Widgets table. Every row belongs to exactly one tenant.
-- tenant_id + ON DELETE CASCADE is what makes multi-tenant isolation
-- real at the DB level, not just enforced in application code.

CREATE TABLE IF NOT EXISTS widgets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('signup_form', 'cta', 'popover')),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  button_text      TEXT NOT NULL DEFAULT 'Submit',
  form_fields      JSONB NOT NULL DEFAULT '[]',       -- e.g. [{ "name": "email", "label": "Email", "type": "email", "required": true }]
  display_options  JSONB NOT NULL DEFAULT '{}',        -- e.g. { "theme": "light", "position": "bottom-right" }
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every list/lookup query filters by tenant_id first — index it.
CREATE INDEX IF NOT EXISTS idx_widgets_tenant_id ON widgets (tenant_id);
