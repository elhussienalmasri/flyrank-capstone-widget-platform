// Platform-admin logic: list every tenant account with their
// widgets, and permanently delete an account. Kept entirely
// separate from auth.service.js (tenant self-service) — an admin
// acting on someone else's account is a different trust boundary
// than a tenant acting on their own.
import ApiError from '../utils/ApiError.js';
import * as tenantsRepo from '../repositories/tenants.repository.js';
import * as widgetsRepo from '../repositories/widgets.repository.js';

function toPublicTenant(tenant) {
  return {
    id: tenant.id,
    companyName: tenant.company_name,
    email: tenant.email,
    emailVerified: Boolean(tenant.email_verified),
    createdAt: tenant.created_at,
  };
}

function toPublicWidget(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    createdAt: row.created_at,
  };
}

export async function listAccounts() {
  const tenants = await tenantsRepo.findAll();

  // One query per tenant, not a single JOIN — kept simple and
  // readable for a platform-admin listing that isn't on any hot
  // request path. Fine to revisit if the tenant count grows large.
  const accounts = await Promise.all(
    tenants.map(async (tenant) => {
      const widgets = await widgetsRepo.findAllByTenant(tenant.id);
      return { ...toPublicTenant(tenant), widgets: widgets.map(toPublicWidget) };
    })
  );

  return accounts;
}

// Cascades to that tenant's widgets, submissions, and visitor
// accounts via the ON DELETE CASCADE foreign keys already in place.
// This is the ONLY place account deletion happens — a tenant cannot
// delete their own account; only the platform admin can.
export async function deleteAccount(tenantId) {
  const deleted = await tenantsRepo.deleteById(tenantId);
  if (!deleted) throw new ApiError(404, 'Account not found');
}
