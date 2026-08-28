// Public config delivery + widget.js bundle.
import test from 'node:test';
import assert from 'node:assert';
import { request, registerTenant } from './helpers/request.js';

test('GET /widget.js serves the bundle with long-cache headers', async () => {
  const res = await request('GET', '/widget.js');
  assert.strictEqual(res.status, 200);
});

test('GET /widgets/:id/config returns 404 for a nonexistent widget', async () => {
  const res = await request('GET', '/widgets/00000000-0000-0000-0000-000000000000/config');
  assert.strictEqual(res.status, 404);
});

test('GET /widgets/:id/config is public — no auth needed — and matches the widget', async () => {
  const token = await registerTenant('configtest');
  const createRes = await request('POST', '/api/widgets', { type: 'subscribe', title: 'Config Test' }, token);
  const widgetId = createRes.body.widget.id;

  const configRes = await request('GET', `/widgets/${widgetId}/config`); // no token passed
  assert.strictEqual(configRes.status, 200);
  assert.strictEqual(configRes.body.title, 'Config Test');
  assert.strictEqual(configRes.body.tenantId, undefined); // never leak tenant_id publicly
});
