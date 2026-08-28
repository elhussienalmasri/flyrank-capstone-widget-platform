// Smoke tests for account creation & login. Requires
// Postgres running and migrated first.
import test from 'node:test';
import assert from 'node:assert';
import { request } from './helpers/request.js';

test('register rejects an invalid email', async () => {
  const res = await request('POST', '/api/auth/register', {
    companyName: 'Acme', email: 'not-an-email', password: 'password123',
  });
  assert.strictEqual(res.status, 400);
});

test('register + login + me happy path', async () => {
  const email = `test-${Date.now()}@example.com`;

  const registerRes = await request('POST', '/api/auth/register', {
    companyName: 'Acme Co', email, password: 'password123',
  });
  assert.strictEqual(registerRes.status, 201);
  assert.ok(registerRes.body.token);

  const loginRes = await request('POST', '/api/auth/login', { email, password: 'password123' });
  assert.strictEqual(loginRes.status, 200);

  const meRes = await request('GET', '/api/auth/me', null, loginRes.body.token);
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.body.tenant.email, email);
});

test('login rejects wrong password', async () => {
  const email = `test2-${Date.now()}@example.com`;
  await request('POST', '/api/auth/register', { companyName: 'Acme', email, password: 'password123' });

  const res = await request('POST', '/api/auth/login', { email, password: 'wrongpass' });
  assert.strictEqual(res.status, 401);
});
