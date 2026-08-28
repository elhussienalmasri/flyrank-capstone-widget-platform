// Smoke tests for widget CRUD + tenant isolation. Requires
// Postgres running and migrated first.
import test from 'node:test';
import assert from 'node:assert';
import { request, registerTenant } from './helpers/request.js';

test('rejects widget creation without a token', async () => {
  const res = await request('POST', '/api/widgets', { type: 'subscribe', title: 'X' });
  assert.strictEqual(res.status, 401);
});

test('create + list + get widget for the owning tenant', async () => {
  const token = await registerTenant('owner');

  const createRes = await request('POST', '/api/widgets', {
    type: 'subscribe', title: 'Newsletter Signup', description: 'Join our list', buttonText: 'Subscribe',
  }, token);
  assert.strictEqual(createRes.status, 201);
  assert.ok(createRes.body.widget.embedSnippet.includes(createRes.body.widget.id));

  const listRes = await request('GET', '/api/widgets', null, token);
  assert.strictEqual(listRes.status, 200);
  assert.strictEqual(listRes.body.widgets.length, 1);

  const getRes = await request('GET', `/api/widgets/${createRes.body.widget.id}`, null, token);
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getRes.body.widget.title, 'Newsletter Signup');
});

test('tenant isolation: tenant B cannot read or modify tenant A widget', async () => {
  const tokenA = await registerTenant('tenantA');
  const tokenB = await registerTenant('tenantB');

  const createRes = await request('POST', '/api/widgets', { type: 'subscribe', title: 'A-only widget' }, tokenA);
  const widgetId = createRes.body.widget.id;

  const getAsB = await request('GET', `/api/widgets/${widgetId}`, null, tokenB);
  assert.strictEqual(getAsB.status, 404);

  const updateAsB = await request('PATCH', `/api/widgets/${widgetId}`, { title: 'Hijacked' }, tokenB);
  assert.strictEqual(updateAsB.status, 404);

  const deleteAsB = await request('DELETE', `/api/widgets/${widgetId}`, null, tokenB);
  assert.strictEqual(deleteAsB.status, 404);

  const getAsA = await request('GET', `/api/widgets/${widgetId}`, null, tokenA);
  assert.strictEqual(getAsA.status, 200);
  assert.strictEqual(getAsA.body.widget.title, 'A-only widget');
});

test('rejects invalid widget type', async () => {
  const token = await registerTenant('validation');
  const res = await request('POST', '/api/widgets', { type: 'not_a_real_type', title: 'X' }, token);
  assert.strictEqual(res.status, 400);
});

test('rejects a cta widget created with zero fields', async () => {
  const token = await registerTenant('nofieldscta');
  const res = await request('POST', '/api/widgets', { type: 'cta', title: 'Empty CTA', formFields: [] }, token);
  assert.strictEqual(res.status, 400);
});

test('rejects a popover widget created with zero fields', async () => {
  const token = await registerTenant('nofieldspopover');
  const res = await request('POST', '/api/widgets', { type: 'popover', title: 'Empty Popover' }, token);
  assert.strictEqual(res.status, 400); // no formFields supplied at all, and popover has no default
});

test('accepts a cta widget with at least one field', async () => {
  const token = await registerTenant('onefieldcta');
  const res = await request('POST', '/api/widgets', {
    type: 'cta', title: 'Valid CTA',
    formFields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
  }, token);
  assert.strictEqual(res.status, 201);
});

test('rejects editing a widget down to zero fields', async () => {
  const token = await registerTenant('editnofields');
  const createRes = await request('POST', '/api/widgets', {
    type: 'cta', title: 'Starts fine',
    formFields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
  }, token);
  const widgetId = createRes.body.widget.id;

  const editRes = await request('PATCH', `/api/widgets/${widgetId}`, { formFields: [] }, token);
  assert.strictEqual(editRes.status, 400);
});

test('cta widget accepts and returns custom appearance/thank-you display options', async () => {
  const token = await registerTenant('ctaappearance');
  const res = await request('POST', '/api/widgets', {
    type: 'cta',
    title: 'Special Offer',
    formFields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
    displayOptions: {
      accentColor: '#16a34a',
      thankYouTitle: 'You are in!',
      thankYouLinkUrl: 'https://example.com/offer',
      thankYouLinkText: 'Claim it',
      thankYouButtonColor: '#dc2626',
    },
  }, token);

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.widget.displayOptions.accentColor, '#16a34a');
  assert.strictEqual(res.body.widget.displayOptions.thankYouButtonColor, '#dc2626');
});

test('subscribe widget defaults to email-only when no fields are supplied', async () => {
  const token = await registerTenant('subscribedefault');
  const res = await request('POST', '/api/widgets', { type: 'subscribe', title: 'Newsletter' }, token);
  assert.strictEqual(res.status, 201);
  assert.deepStrictEqual(res.body.widget.formFields.map((f) => f.name), ['email']);
});

test('subscribe widget accepts name + email (max 2 fields)', async () => {
  const token = await registerTenant('subscribenameemail');
  const res = await request('POST', '/api/widgets', {
    type: 'subscribe', title: 'Newsletter',
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: false },
      { name: 'email', label: 'Email', type: 'email', required: true },
    ],
  }, token);
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.widget.formFields.length, 2);
});

test('subscribe widget rejects a third field', async () => {
  const token = await registerTenant('subscribethree');
  const res = await request('POST', '/api/widgets', {
    type: 'subscribe', title: 'Newsletter',
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: false },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: false },
    ],
  }, token);
  assert.strictEqual(res.status, 400);
});

test('subscribe widget rejects a field other than name/email', async () => {
  const token = await registerTenant('subscribewrongfield');
  const res = await request('POST', '/api/widgets', {
    type: 'subscribe', title: 'Newsletter',
    formFields: [{ name: 'phone', label: 'Phone', type: 'tel', required: false }],
  }, token);
  assert.strictEqual(res.status, 400);
});

test('subscribe widget rejects fields with no email present', async () => {
  const token = await registerTenant('subscribenoemail');
  const res = await request('POST', '/api/widgets', {
    type: 'subscribe', title: 'Newsletter',
    formFields: [{ name: 'name', label: 'Name', type: 'text', required: false }],
  }, token);
  assert.strictEqual(res.status, 400);
});

test('editing a subscribe widget to add a third field is rejected', async () => {
  const token = await registerTenant('subscribeeditthree');
  const createRes = await request('POST', '/api/widgets', { type: 'subscribe', title: 'Newsletter' }, token);
  const widgetId = createRes.body.widget.id;

  const editRes = await request('PATCH', `/api/widgets/${widgetId}`, {
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: false },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'company', label: 'Company', type: 'text', required: false },
    ],
  }, token);
  assert.strictEqual(editRes.status, 400);
});

test('a required name field on a subscribe widget is enforced at submission time', async () => {
  const token = await registerTenant('subscriberequiredname');
  const createRes = await request('POST', '/api/widgets', {
    type: 'subscribe', title: 'Newsletter',
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
    ],
  }, token);
  const widgetId = createRes.body.widget.id;

  const missingNameRes = await request('POST', '/submissions', { widgetId, fields: { email: 'x@example.com' } });
  assert.strictEqual(missingNameRes.status, 400);

  const fullRes = await request('POST', '/submissions', {
    widgetId, fields: { name: 'Someone', email: 'x@example.com' },
  });
  assert.strictEqual(fullRes.status, 201);
});
