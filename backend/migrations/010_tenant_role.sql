-- 010_tenant_role.sql
-- Adds a role to tenants so the platform admin is just a tenant row
-- with role='admin' — same table, same login, same JWT shape (with
-- role added to the payload). No separate admin credential system.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'owner'
  CHECK (role IN ('owner', 'admin'));
