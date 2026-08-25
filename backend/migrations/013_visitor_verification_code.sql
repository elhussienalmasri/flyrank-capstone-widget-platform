-- 013_visitor_verification_code.sql
-- Widget (visitor) email verification switches from a clickable
-- link to a short numeric CODE the visitor types directly into the
-- widget on the customer's own website. A link would have sent them
-- to the widget PLATFORM's frontend — a page they never otherwise
-- visit — instead of keeping the flow on the site they're actually
-- using. The code is looked up by (widget_id, email, code) together,
-- not by itself, so it no longer needs to be globally unique.
--
-- (Tenant/owner account verification is unaffected — that flow
-- happens directly on the platform's own frontend, where a link is
-- the right choice.)

DROP INDEX IF EXISTS idx_pending_widget_visitors_token;
