// Item 1: combined account view (tenant + widgets). Account
// deletion is admin-only — see tests/admin.test.js.
// Item 2: tenant registration (deferred or immediate, depending on
// REQUIRE_EMAIL_VERIFICATION) + forgot/reset/change password.
import test from 'node:test';
import assert from 'node:assert';
import { request, registerTenant } from './helpers/request.js';
import * as tenantsRepo from '../src/repositories/tenants.repository.js';
import * as pendingRegistrationsRepo from '../src/repositories/pendingRegistrations.repository.js';
import env from '../src/config/env.js';

const deferredCreation = env.emailFeaturesEnabled && env.requireEmailVerificationForSignup;

async function registerAndComplete(label) {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const registerRes = await request('POST', '/api/auth/register', {
    companyName: `${label} Co`, email, password: 'password123',
  });

  if (registerRes.body?.token) {
    return { token: registerRes.body.token, email, tenant: registerRes.body.tenant };
  }

  const pending = await pendingRegistrationsRepo.findByEmail(email);
  const verifyRes = await request('POST', '/api/auth/verify-email', { token: pending.verification_token });
  return { token: verifyRes.body.token, email, tenant: verifyRes.body.tenant };
}

test('GET /api/account returns the tenant profile plus their widgets', async () => {
  const { token } = await registerAndComplete('accountview');
  await request('POST', '/api/widgets', { type: 'subscribe', title: 'Newsletter' }, token);

  const res = await request('GET', '/api/account', null, token);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.tenant.email);
  assert.strictEqual(res.body.widgets.length, 1);
  assert.strictEqual(res.body.widgets[0].title, 'Newsletter');
});

// Account deletion is admin-only now — see tests/admin.test.js.
// A tenant can no longer delete their own account via the API.
test('DELETE /api/auth/me no longer exists (tenants cannot self-delete)', async () => {
  const { token } = await registerAndComplete('noselfdelete');
  const res = await request('DELETE', '/api/auth/me', null, token);
  assert.strictEqual(res.status, 404); // route removed entirely — falls through to notFoundHandler
});

test('every new registration gets role "owner", never "admin"', async () => {
  const { tenant } = await registerAndComplete('roleowner');
  assert.strictEqual(tenant.role, 'owner');
});

if (deferredCreation) {
  test('[deferred mode] registering does NOT create a tenant until verified', async () => {
    const email = `deferred-${Date.now()}@example.com`;
    const registerRes = await request('POST', '/api/auth/register', {
      companyName: 'Deferred Co', email, password: 'password123',
    });
    assert.strictEqual(registerRes.status, 202);
    assert.strictEqual(registerRes.body.pending, true);
    assert.strictEqual(registerRes.body.token, undefined);

    // No tenant row exists yet — login must fail.
    const loginRes = await request('POST', '/api/auth/login', { email, password: 'password123' });
    assert.strictEqual(loginRes.status, 401);

    // The pending record exists with a real token.
    const pending = await pendingRegistrationsRepo.findByEmail(email);
    assert.ok(pending.verification_token);
  });

  test('[deferred mode] verifying creates the account and logs the user straight in', async () => {
    const email = `deferredverify-${Date.now()}@example.com`;
    await request('POST', '/api/auth/register', { companyName: 'Deferred Verify Co', email, password: 'password123' });
    const pending = await pendingRegistrationsRepo.findByEmail(email);

    const verifyRes = await request('POST', '/api/auth/verify-email', { token: pending.verification_token });
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.body.created, true);
    assert.ok(verifyRes.body.token, 'expected a login token to be returned immediately');
    assert.strictEqual(verifyRes.body.tenant.emailVerified, true); // verified at the moment of creation

    // Now a real account exists — login works.
    const loginRes = await request('POST', '/api/auth/login', { email, password: 'password123' });
    assert.strictEqual(loginRes.status, 200);
  });

  test('[deferred mode] re-registering the same email before verifying just refreshes the pending token', async () => {
    const email = `deferredretry-${Date.now()}@example.com`;
    await request('POST', '/api/auth/register', { companyName: 'First', email, password: 'password123' });
    const firstPending = await pendingRegistrationsRepo.findByEmail(email);

    await request('POST', '/api/auth/register', { companyName: 'Second', email, password: 'password123' });
    const secondPending = await pendingRegistrationsRepo.findByEmail(email);

    assert.notStrictEqual(firstPending.verification_token, secondPending.verification_token);
    assert.strictEqual(secondPending.company_name, 'Second');
  });
} else {
  test('[immediate mode] registration creates an unverified account right away, and login works', async () => {
    const { token, tenant } = await registerAndComplete('unverified');
    assert.strictEqual(tenant.emailVerified, false);

    const meRes = await request('GET', '/api/auth/me', null, token);
    assert.strictEqual(meRes.status, 200); // unverified users are not locked out in this mode
  });

  test('[immediate mode] verify-email accepts a valid token and marks the account verified', async () => {
    const { email } = await registerAndComplete('verifyflow');
    const raw = await tenantsRepo.findByEmail(email);
    assert.ok(raw.email_verification_token, 'expected a verification token to have been stored');

    const verifyRes = await request('POST', '/api/auth/verify-email', { token: raw.email_verification_token });
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.body.created, false);

    const after = await tenantsRepo.findByEmail(email);
    assert.strictEqual(after.email_verified, true);
  });
}

test('verify-email rejects an invalid token', async () => {
  const res = await request('POST', '/api/auth/verify-email', { token: 'not-a-real-token' });
  assert.strictEqual(res.status, 400);
});

test('forgot-password always returns the same response, whether or not the email exists', async () => {
  const knownRes = await request('POST', '/api/auth/forgot-password', { email: 'nonexistent@example.com' });
  assert.strictEqual(knownRes.status, 200);
  assert.strictEqual(knownRes.body.sent, true);
});

test('forgot-password + reset-password happy path', async () => {
  const { email } = await registerAndComplete('resetflow');

  await request('POST', '/api/auth/forgot-password', { email });
  const raw = await tenantsRepo.findByEmail(email);
  assert.ok(raw.password_reset_token, 'expected a reset token to have been stored');

  const resetRes = await request('POST', '/api/auth/reset-password', {
    token: raw.password_reset_token, newPassword: 'brandNewPassword123',
  });
  assert.strictEqual(resetRes.status, 200);

  const loginRes = await request('POST', '/api/auth/login', { email, password: 'brandNewPassword123' });
  assert.strictEqual(loginRes.status, 200);
});

test('reset-password rejects an invalid or expired token', async () => {
  const res = await request('POST', '/api/auth/reset-password', { token: 'not-a-real-token', newPassword: 'password123' });
  assert.strictEqual(res.status, 400);
});

test('change-password requires the correct current password', async () => {
  const { token } = await registerAndComplete('changepw');

  const wrongRes = await request('POST', '/api/auth/change-password', {
    currentPassword: 'wrongpassword', newPassword: 'newpassword123',
  }, token);
  assert.strictEqual(wrongRes.status, 401);

  const rightRes = await request('POST', '/api/auth/change-password', {
    currentPassword: 'password123', newPassword: 'newpassword123',
  }, token);
  assert.strictEqual(rightRes.status, 200);
});
