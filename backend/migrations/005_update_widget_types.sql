-- 005_update_widget_types.sql
-- The widget type set changed: 'signup_form' -> 'subscribe', and two
-- new types ('signup', 'login') were added alongside 'cta'/'popover'.
-- The CHECK constraint from 002_widgets.sql still only allowed the
-- old 3 values — this brings the DB constraint in line with
-- src/schemas/widget.schema.js's WIDGET_TYPES.

-- Migrate any existing rows using the old value before the
-- constraint is tightened, so this doesn't fail on real data.
UPDATE widgets SET type = 'subscribe' WHERE type = 'signup_form';

ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_type_check;

ALTER TABLE widgets
  ADD CONSTRAINT widgets_type_check
  CHECK (type IN ('subscribe', 'signup', 'login', 'cta', 'popover'));
