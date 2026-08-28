-- 012_widget_scoped_visitor_identity.sql
-- Identity for signup widgets moves from TENANT-scoped to
-- WIDGET-scoped: a visitor can now hold separate accounts on two
-- different signup widgets under the same tenant using the same
-- email address — signing up on widget A no longer blocks signing
-- up on widget B with that email. Duplicate signup on the SAME
-- widget is still rejected, just narrower than before.
--
-- Login remains tenant-wide on purpose (see visitors.repository.js)
-- so a separate login widget can still authenticate an account
-- regardless of which signup widget originally created it — the
-- trade-off is that if the same email now exists on more than one
-- widget under a tenant, login resolves to the most recently
-- created matching account (deterministic, not ambiguous).

DROP INDEX IF EXISTS idx_widget_visitors_tenant_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_widget_visitors_widget_email
  ON widget_visitors (widget_id, email);

DROP INDEX IF EXISTS idx_pending_widget_visitors_tenant_email;
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_widget_visitors_widget_email
  ON pending_widget_visitors (widget_id, email);
