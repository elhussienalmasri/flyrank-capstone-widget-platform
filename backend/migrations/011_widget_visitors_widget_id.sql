-- 011_widget_visitors_widget_id.sql
-- Tracks which SIGNUP widget a visitor originally signed up through,
-- so the dashboard can filter "which users belong to which widget".
-- Nullable + ON DELETE SET NULL (not CASCADE): a visitor's account
-- is tenant-owned, not widget-owned — deleting the signup widget
-- they used shouldn't delete their account, since they might still
-- log in via a separate login widget under the same tenant.

ALTER TABLE widget_visitors
  ADD COLUMN IF NOT EXISTS widget_id UUID REFERENCES widgets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_widget_visitors_widget_id ON widget_visitors (widget_id);
