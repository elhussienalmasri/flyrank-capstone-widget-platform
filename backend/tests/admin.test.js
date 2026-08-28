// Platform-admin API: list every tenant + their widgets, and delete
// an account (cascades widgets/submissions/visitors). The admin is
// just a tenant row with role='admin' — same login, same JWT, an
// added role check. Tests adapt to whether ADMIN_EMAIL/ADMIN_PASSWORD
// are configured in the environment they're run in.
import { test, before } from 'node:test';
import assert from 'node:assert';

// Keep admin-only test credentials in the test itself so a developer's .env
// never needs real or dummy admin credentials just to run the suite.
process.env.ADMIN_EMAIL = 'admin-test@example.com';
process.env.ADMIN_PASSWORD = 'TestAdminPassword123!';

const [requestHelpers, { default: env }, authService] = await Promise.all([
  import('./helpers/request.js'),
  import('../src/config/env.js'),
  import('../src/services/auth.service.js'),
]);

const { request, registerTenant } = requestHelpers;
const { ensureAdminAccount } = authService;

const adminConfigured = Boolean(env.adminEmail && env.adminPassword);
let adminToken = null;

// server.js normally calls this at boot — tests import app.js
// directly, bypassing that, so it has to run explicitly here.
before(async () => {
  if (!adminConfigured) return;
  await ensureAdminAccount();
  const loginRes = await request('POST', '/api/auth/login', {
    email: env.adminEmail,
    password: env.adminPassword,
  });
  adminToken = loginRes.body.token;
});

test('admin routes reject requests with no token', async () => {
  const res = await request('GET', '/api/admin/accounts', null, null);
  assert.strictEqual(res.status, 401);
});

test('admin routes reject a valid token that is not an admin', async () => {
  const ownerToken = await registerTenant('notadmin');
  const res = await request('GET', '/api/admin/accounts', null, ownerToken);
  assert.strictEqual(res.status, 403);
});

test('logging in with the admin credentials returns role: admin', async (t) => {
  if (!adminConfigured) {
    t.skip('ADMIN_EMAIL/ADMIN_PASSWORD not set in this environment — skipping');
    return;
  }
  const res = await request('POST', '/api/auth/login', { email: env.adminEmail, password: env.adminPassword });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.tenant.role, 'admin');
});

test('a regular registered account has role: owner, never admin', async () => {
  const email = `regularowner-${Date.now()}@example.com`;
  const res = await request('POST', '/api/auth/register', {
    companyName: 'Regular Co', email, password: 'password123',
  });
  // Depending on REQUIRE_EMAIL_VERIFICATION, this may be 201 (immediate) or 202 (pending).
  if (res.status === 201) {
    assert.strictEqual(res.body.tenant.role, 'owner');
  } else {
    assert.strictEqual(res.status, 202);
  }
});

test('admin can list every owner account with their widgets', async (t) => {
  if (!adminConfigured) {
    t.skip('ADMIN_EMAIL/ADMIN_PASSWORD not set in this environment — skipping');
    return;
  }

  const ownerToken = await registerTenant('adminlisted');
  await request('POST', '/api/widgets', { type: 'subscribe', title: 'Admin-visible widget' }, ownerToken);

  const res = await request('GET', '/api/admin/accounts', null, adminToken);
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.accounts));

  const match = res.body.accounts.find((a) => a.widgets.some((w) => w.title === 'Admin-visible widget'));
  assert.ok(match, 'expected to find the tenant with their widget in the admin listing');

  // The admin account itself should never appear in this listing.
  const adminInList = res.body.accounts.find((a) => a.email === env.adminEmail);
  assert.strictEqual(adminInList, undefined);
});

test('admin delete cascades: widget config is gone afterward', async (t) => {
  if (!adminConfigured) {
    t.skip('ADMIN_EMAIL/ADMIN_PASSWORD not set in this environment — skipping');
    return;
  }

  const ownerToken = await registerTenant('admindelete');
  const createRes = await request('POST', '/api/widgets', { type: 'subscribe', title: 'Doomed widget' }, ownerToken);
  const widgetId = createRes.body.widget.id;

  const meRes = await request('GET', '/api/auth/me', null, ownerToken);
  const tenantId = meRes.body.tenant.id;

  const deleteRes = await request('DELETE', `/api/admin/accounts/${tenantId}`, null, adminToken);
  assert.strictEqual(deleteRes.status, 204);

  const configRes = await request('GET', `/widgets/${widgetId}/config`);
  assert.strictEqual(configRes.status, 404); // cascade actually removed the widget

  const meAfterRes = await request('GET', '/api/auth/me', null, ownerToken);
  assert.ok([401, 404].includes(meAfterRes.status)); // the tenant itself is gone
});

test('deleting a nonexistent account returns 404', async (t) => {
  if (!adminConfigured) {
    t.skip('ADMIN_EMAIL/ADMIN_PASSWORD not set in this environment — skipping');
    return;
  }

  const res = await request('DELETE', '/api/admin/accounts/00000000-0000-0000-0000-000000000000', null, adminToken);
  assert.strictEqual(res.status, 404);
});
