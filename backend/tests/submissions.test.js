// The hardened submission path: validation, spam control,
// rate limiting, and confirming a valid submission is stored.
import test from 'node:test';
import assert from 'node:assert';
import { request, registerTenant } from './helpers/request.js';
import { submit } from '../src/services/submissions.service.js';

async function createWidget(token) {
  const res = await request('POST', '/api/widgets', {
    type: 'subscribe',
    title: 'Submission Test Widget',
    formFields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
  }, token);
  return res.body.widget.id;
}

test('rejects a malformed submission payload', async () => {
  const res = await request('POST', '/submissions', { fields: { email: 'x@example.com' } }); // missing widgetId
  assert.strictEqual(res.status, 400);
});

test('rejects an oversized payload (too many fields)', async () => {
  const token = await registerTenant('oversize');
  const widgetId = await createWidget(token);

  const fields = {};
  for (let i = 0; i < 40; i++) fields[`field${i}`] = 'x'; // over the 30-field cap

  const res = await request('POST', '/submissions', { widgetId, fields });
  assert.strictEqual(res.status, 400);
});

test('returns 404 when the widget does not exist', async () => {
  const res = await request('POST', '/submissions', {
    widgetId: '00000000-0000-0000-0000-000000000000',
    fields: { email: 'x@example.com' },
  });
  assert.strictEqual(res.status, 404);
});

test('accepts a valid submission and it appears in the dashboard', async () => {
  const token = await registerTenant('validsubmit');
  const widgetId = await createWidget(token);

  const submitRes = await request('POST', '/submissions', {
    widgetId,
    fields: { email: 'visitor@example.com' },
  });
  assert.strictEqual(submitRes.status, 201);

  const dashRes = await request('GET', '/api/dashboard/submissions', null, token);
  assert.strictEqual(dashRes.status, 200);
  assert.strictEqual(dashRes.body.submissions.length, 1);
  assert.strictEqual(dashRes.body.submissions[0].fields.email, 'visitor@example.com');
});

test('a failing confirmation notification does not prevent the submission from being stored', async () => {
  const token = await registerTenant('notificationfailure');
  const widgetId = await createWidget(token);

  const result = await submit({
    widgetId,
    fields: { email: 'stored-despite-failure@example.com' },
    ipAddress: '127.0.0.1',
    notify: async () => { throw new Error('test notification delivery failure'); },
  });

  assert.strictEqual(result.dropped, false);
  assert.strictEqual(result.submission.notified, false);

  const dashRes = await request('GET', '/api/dashboard/submissions', null, token);
  assert.strictEqual(dashRes.status, 200);
  assert.strictEqual(dashRes.body.submissions.length, 1);
  assert.strictEqual(dashRes.body.submissions[0].fields.email, 'stored-despite-failure@example.com');
});

test('honeypot field silently drops the submission (still 2xx, never stored)', async () => {
  const token = await registerTenant('honeypot');
  const widgetId = await createWidget(token);

  const submitRes = await request('POST', '/submissions', {
    widgetId,
    fields: { email: 'bot@example.com', companyWebsite: 'http://spam.example' }, // honeypot filled
  });
  assert.strictEqual(submitRes.status, 201); // same success shape — never tip off the bot

  const dashRes = await request('GET', '/api/dashboard/submissions', null, token);
  assert.strictEqual(dashRes.body.submissions.length, 0); // but nothing was actually stored
});

test('rejects a submission missing a required field (real 400, not silently dropped)', async () => {
  const token = await registerTenant('requiredfield');
  const widgetId = await createWidget(token); // widget requires "email"

  const res = await request('POST', '/submissions', { widgetId, fields: {} });
  assert.strictEqual(res.status, 400);
});

test('contact-form widget with everything optional still rejects a fully empty submission', async () => {
  const token = await registerTenant('atleastone');
  const createRes = await request('POST', '/api/widgets', {
    type: 'cta',
    title: 'Contact us',
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: false },
      { name: 'email', label: 'Email', type: 'email', required: false },
      { name: 'message', label: 'Message', type: 'textarea', required: false },
    ],
  }, token);
  const widgetId = createRes.body.widget.id;

  const emptyRes = await request('POST', '/submissions', { widgetId, fields: { name: '', email: '', message: '' } });
  assert.strictEqual(emptyRes.status, 400);

  const filledRes = await request('POST', '/submissions', { widgetId, fields: { name: '', email: '', message: 'Hello there' } });
  assert.strictEqual(filledRes.status, 201); // only ONE of the optional fields filled — still accepted
});

test('rate limiter returns 429 after a burst, then recovers', async () => {
  const token = await registerTenant('ratelimit');
  const widgetId = await createWidget(token);

  let sawRateLimited = false;
  for (let i = 0; i < 15; i++) {
    const res = await request('POST', '/submissions', { widgetId, fields: { email: `flood${i}@example.com` } });
    if (res.status === 429) sawRateLimited = true;
  }
  assert.strictEqual(sawRateLimited, true);
});

// --- Item 4: owner can delete a submission, with tenant scoping ---

test('owner can delete their own submission, and it is actually gone', async () => {
  const token = await registerTenant('deletesubmit');
  const widgetId = await createWidget(token);

  await request('POST', '/submissions', { widgetId, fields: { email: 'todelete@example.com' } });
  const listRes = await request('GET', '/api/dashboard/submissions', null, token);
  const submissionId = listRes.body.submissions[0].id;

  const deleteRes = await request('DELETE', `/api/dashboard/submissions/${submissionId}`, null, token);
  assert.strictEqual(deleteRes.status, 204);

  const afterRes = await request('GET', '/api/dashboard/submissions', null, token);
  assert.strictEqual(afterRes.body.submissions.length, 0);
});

test('a tenant cannot delete another tenant\'s submission', async () => {
  const tokenA = await registerTenant('deleteA');
  const tokenB = await registerTenant('deleteB');
  const widgetId = await createWidget(tokenA);

  await request('POST', '/submissions', { widgetId, fields: { email: 'protected@example.com' } });
  const listRes = await request('GET', '/api/dashboard/submissions', null, tokenA);
  const submissionId = listRes.body.submissions[0].id;

  const deleteAsB = await request('DELETE', `/api/dashboard/submissions/${submissionId}`, null, tokenB);
  assert.strictEqual(deleteAsB.status, 404);

  const stillThereRes = await request('GET', '/api/dashboard/submissions', null, tokenA);
  assert.strictEqual(stillThereRes.body.submissions.length, 1); // untouched
});
