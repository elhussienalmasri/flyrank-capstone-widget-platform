-- 008_pending_registrations.sql
-- Staging area for tenant signups when REQUIRE_EMAIL_VERIFICATION is
-- on: no `tenants` row is created until the verification link is
-- clicked. One row per in-progress signup, keyed by email so a
-- repeated registration attempt just refreshes the token instead of
-- piling up duplicates.

CREATE TABLE IF NOT EXISTS pending_registrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name          TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  password_hash         TEXT NOT NULL,
  verification_token    TEXT NOT NULL,
  verification_expires  TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_registrations_token
  ON pending_registrations (verification_token);
