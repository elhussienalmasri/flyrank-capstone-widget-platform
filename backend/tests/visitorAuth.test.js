// Visitor accounts: signup (with password confirmation) + login on
// signup/login widgets, and cross-widget/tenant scoping rules.
import test from 'node:test';
import assert from 'node:assert';
import { request, registerTenant } from './helpers/request.js';
import * as visitorsRepo from '../src/repositories/visitors.repository.js';
import * as widgetsRepo from '../src/repositories/widgets.repository.js';
import * as pendingVisitorsRepo from '../src/repositories/pendingVisitors.repository.js';

async function createWidget(token, type) {
  const res = await request('POST', '/api/widgets', { type, title: `${type} widget` }, token);
  return res.body.widget.id;
}

test('signup rejects mismatched passwords', async () => {
  const token = await registerTenant('signupmismatch');
  const widgetId = await createWidget(token, 'signup');

  const res = await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'Visitor One', email: 'v1@example.com', password: 'password123', confirmPassword: 'different123',
  });
  assert.strictEqual(res.status, 400);
});

test('signup + login happy path returns a token', async () => {
  const token = await registerTenant('signuphappy');
  const signupWidgetId = await createWidget(token, 'signup');
  const loginWidgetId = await createWidget(token, 'login'); // different widget, same tenant

  const email = `visitor-${Date.now()}@example.com`;

  const signupRes = await request('POST', `/widgets/${signupWidgetId}/signup`, {
    name: 'Visitor Two', email, password: 'password123', confirmPassword: 'password123',
  });
  assert.strictEqual(signupRes.status, 201);
  assert.ok(signupRes.body.token);
  assert.strictEqual(signupRes.body.visitor.email, email);

  // Logging in via a DIFFERENT widget under the same tenant must
  // still find the account — proves tenant-scoping, not widget-scoping.
  const loginRes = await request('POST', `/widgets/${loginWidgetId}/login`, {
    email, password: 'password123',
  });
  assert.strictEqual(loginRes.status, 200);
  assert.ok(loginRes.body.token);
});

test('signup rejects a duplicate email on the SAME widget', async () => {
  const token = await registerTenant('signupdupe');
  const widgetId = await createWidget(token, 'signup');
  const email = `dupe-${Date.now()}@example.com`;

  await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'First', email, password: 'password123', confirmPassword: 'password123',
  });

  const secondRes = await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'Second', email, password: 'password123', confirmPassword: 'password123',
  });
  assert.strictEqual(secondRes.status, 409);
});

test('the same email CAN sign up separately on two different signup widgets under the same tenant', async () => {
  const token = await registerTenant('crosswidgetsignup');
  const widgetAId = await createWidget(token, 'signup');
  const widgetBId = await createWidget(token, 'signup');
  const email = `crosswidget-${Date.now()}@example.com`;

  const firstRes = await request('POST', `/widgets/${widgetAId}/signup`, {
    name: 'On Widget A', email, password: 'passwordA123', confirmPassword: 'passwordA123',
  });
  assert.strictEqual(firstRes.status, 201);

  const secondRes = await request('POST', `/widgets/${widgetBId}/signup`, {
    name: 'On Widget B', email, password: 'passwordB123', confirmPassword: 'passwordB123',
  });
  assert.strictEqual(secondRes.status, 201); // separate account — not blocked

  const listRes = await request('GET', '/api/dashboard/visitors', null, token);
  assert.strictEqual(listRes.body.visitors.length, 2); // two genuinely separate accounts

  // Login stays tenant-wide (not widget-scoped) on purpose, so a
  // separate login widget still works regardless of which signup
  // widget created the account. The known trade-off: with the same
  // email now on two widgets, login resolves to whichever account
  // was created MOST RECENTLY — here, Widget B's — regardless of
  // which widget's login endpoint is called.
  const loginRes = await request('POST', `/widgets/${widgetAId}/login`, { email, password: 'passwordB123' });
  assert.strictEqual(loginRes.status, 200); // matches Widget B's account, the newer one

  const staleLoginRes = await request('POST', `/widgets/${widgetBId}/login`, { email, password: 'passwordA123' });
  assert.strictEqual(staleLoginRes.status, 401); // Widget A's account is no longer what email-only login resolves to
});

test('login rejects wrong password without revealing which part was wrong', async () => {
  const token = await registerTenant('loginwrong');
  const widgetId = await createWidget(token, 'signup');
  const email = `wrongpass-${Date.now()}@example.com`;

  await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'Visitor', email, password: 'password123', confirmPassword: 'password123',
  });

  const res = await request('POST', `/widgets/${widgetId}/login`, { email, password: 'wrongpassword' });
  assert.strictEqual(res.status, 401);
});

test('a signup widget gets sensible default fields when none are supplied', async () => {
  const token = await registerTenant('signupdefaults');
  const createRes = await request('POST', '/api/widgets', { type: 'signup', title: 'Create Account' }, token);
  const fieldNames = createRes.body.widget.formFields.map((f) => f.name);
  assert.deepStrictEqual(fieldNames, ['name', 'email', 'password', 'confirmPassword']);
});

test('a cta widget with no formFields gets an empty array (owner must define their own)', async () => {
  const token = await registerTenant('ctadefaults');
  const createRes = await request('POST', '/api/widgets', { type: 'cta', title: 'Special Offer' }, token);
  assert.deepStrictEqual(createRes.body.widget.formFields, []);
});

test('registered visitors appear in the dashboard, without a password hash, and logging in does not add a second entry', async () => {
  const token = await registerTenant('visitorlist');
  const signupWidgetId = await createWidget(token, 'signup');
  const loginWidgetId = await createWidget(token, 'login');
  const email = `dashboardvisitor-${Date.now()}@example.com`;

  await request('POST', `/widgets/${signupWidgetId}/signup`, {
    name: 'Dashboard Visitor', email, password: 'password123', confirmPassword: 'password123',
  });

  const listRes = await request('GET', '/api/dashboard/visitors', null, token);
  assert.strictEqual(listRes.status, 200);
  assert.strictEqual(listRes.body.visitors.length, 1);
  assert.strictEqual(listRes.body.visitors[0].email, email);
  assert.strictEqual(listRes.body.visitors[0].password_hash, undefined);
  assert.strictEqual(listRes.body.visitors[0].passwordHash, undefined);

  await request('POST', `/widgets/${loginWidgetId}/login`, { email, password: 'password123' });

  const listAfterLoginRes = await request('GET', '/api/dashboard/visitors', null, token);
  assert.strictEqual(listAfterLoginRes.body.visitors.length, 1); // login never adds a second row
});

// --- Per-widget email verification toggle (off by default) ---

test('signup on a widget WITHOUT verification enabled creates an already-usable account, no token stored', async () => {
  const token = await registerTenant('noverify');
  const widgetId = await createWidget(token, 'signup'); // displayOptions not set -> disabled by default
  const email = `noverify-${Date.now()}@example.com`;

  const signupRes = await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'Visitor', email, password: 'password123', confirmPassword: 'password123',
  });
  assert.strictEqual(signupRes.status, 201);
  assert.strictEqual(signupRes.body.visitor.emailVerified, false); // never auto-verified, just not required either

  // Login should work immediately — verification isn't a login gate, and isn't even enabled here.
  const loginRes = await request('POST', `/widgets/${widgetId}/login`, { email, password: 'password123' });
  assert.strictEqual(loginRes.status, 200);
});

test('forgot/reset password on a widget without verification enabled is rejected (403)', async () => {
  const token = await registerTenant('noverifyreset');
  const widgetId = await createWidget(token, 'signup');
  const email = `noverifyreset-${Date.now()}@example.com`;

  await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'Visitor', email, password: 'password123', confirmPassword: 'password123',
  });

  const forgotRes = await request('POST', `/widgets/${widgetId}/forgot-password`, { email });
  assert.strictEqual(forgotRes.status, 403);
});

test('signup on a widget WITH verification enabled defers account creation until verified', async () => {
  const token = await registerTenant('withverify');
  const createRes = await request('POST', '/api/widgets', {
    type: 'signup',
    title: 'Verified Signup',
    displayOptions: { emailVerificationEnabled: true },
  }, token);
  const widgetId = createRes.body.widget.id;
  const widgetTenantId = (await widgetsRepo.findByIdPublic(widgetId)).tenant_id;
  const email = `withverify-${Date.now()}@example.com`;

  const signupRes = await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'Visitor', email, password: 'password123', confirmPassword: 'password123',
  });
  assert.strictEqual(signupRes.status, 202); // pending — no account created yet
  assert.strictEqual(signupRes.body.pending, true);

  // No widget_visitors row exists yet — login must fail.
  const loginBeforeRes = await request('POST', `/widgets/${widgetId}/login`, { email, password: 'password123' });
  assert.strictEqual(loginBeforeRes.status, 401);

  const pending = await pendingVisitorsRepo.findByWidgetAndEmail(widgetId, email);
  assert.ok(pending, 'expected a pending record to exist after signup');
  assert.match(pending.verification_token, /^\d{6}$/, 'expected a 6-digit verification code, not a link token');

  const verifyRes = await request('POST', `/widgets/${widgetId}/verify-email`, { email, code: pending.verification_token });
  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyRes.body.verified, true);
  assert.ok(verifyRes.body.token, 'expected a login token immediately after verification');
  assert.strictEqual(verifyRes.body.visitor.emailVerified, true);

  // Now the account exists — login works.
  const loginAfterRes = await request('POST', `/widgets/${widgetId}/login`, { email, password: 'password123' });
  assert.strictEqual(loginAfterRes.status, 200);

  const forgotRes = await request('POST', `/widgets/${widgetId}/forgot-password`, { email });
  assert.strictEqual(forgotRes.status, 200); // allowed, since this widget has verification enabled
});

// --- Item: visitors are trackable per-widget, filterable in the dashboard, and deletable ---

test('a visitor is tagged with the signup widget they used, and dashboard filtering by widget works', async () => {
  const token = await registerTenant('widgetscoped');
  const widgetAId = await createWidget(token, 'signup');
  const widgetBId = await createWidget(token, 'signup');

  const emailA = `widgeta-${Date.now()}@example.com`;
  const emailB = `widgetb-${Date.now()}@example.com`;

  await request('POST', `/widgets/${widgetAId}/signup`, {
    name: 'Visitor A', email: emailA, password: 'password123', confirmPassword: 'password123',
  });
  await request('POST', `/widgets/${widgetBId}/signup`, {
    name: 'Visitor B', email: emailB, password: 'password123', confirmPassword: 'password123',
  });

  const allRes = await request('GET', '/api/dashboard/visitors', null, token);
  assert.strictEqual(allRes.body.visitors.length, 2);

  const filteredRes = await request('GET', `/api/dashboard/visitors?widgetId=${widgetAId}`, null, token);
  assert.strictEqual(filteredRes.body.visitors.length, 1);
  assert.strictEqual(filteredRes.body.visitors[0].email, emailA);
  assert.strictEqual(filteredRes.body.visitors[0].widgetId, widgetAId);
});

test('deleting the signup widget does not delete the visitor account it created', async () => {
  const token = await registerTenant('widgetdeleted');
  const widgetId = await createWidget(token, 'signup');
  const email = `survivor-${Date.now()}@example.com`;

  await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'Survivor', email, password: 'password123', confirmPassword: 'password123',
  });

  await request('DELETE', `/api/widgets/${widgetId}`, null, token);

  const listRes = await request('GET', '/api/dashboard/visitors', null, token);
  assert.strictEqual(listRes.body.visitors.length, 1); // the account is untouched
  assert.strictEqual(listRes.body.visitors[0].widgetId, null); // just no longer tied to a widget
});

test('owner can delete a visitor, and a tenant cannot delete another tenant\'s visitor', async () => {
  const tokenA = await registerTenant('deletevisitorA');
  const tokenB = await registerTenant('deletevisitorB');
  const widgetId = await createWidget(tokenA, 'signup');
  const email = `todelete-${Date.now()}@example.com`;

  await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'To Delete', email, password: 'password123', confirmPassword: 'password123',
  });

  const listRes = await request('GET', '/api/dashboard/visitors', null, tokenA);
  const visitorId = listRes.body.visitors[0].id;

  const deleteAsB = await request('DELETE', `/api/dashboard/visitors/${visitorId}`, null, tokenB);
  assert.strictEqual(deleteAsB.status, 404); // wrong tenant, never touched

  const deleteAsA = await request('DELETE', `/api/dashboard/visitors/${visitorId}`, null, tokenA);
  assert.strictEqual(deleteAsA.status, 204);

  const afterRes = await request('GET', '/api/dashboard/visitors', null, tokenA);
  assert.strictEqual(afterRes.body.visitors.length, 0);
});

// --- Item: dashboard overview counts signup/login widgets and total visitors ---

test('dashboard overview counts ALL widgets (including signup/login), not just ones with submissions', async () => {
  const token = await registerTenant('overviewcounts');
  await request('POST', '/api/widgets', { type: 'subscribe', title: 'Newsletter' }, token);
  await request('POST', '/api/widgets', { type: 'signup', title: 'Create account' }, token);
  await request('POST', '/api/widgets', { type: 'login', title: 'Sign in' }, token);

  const overviewRes = await request('GET', '/api/dashboard/overview', null, token);
  assert.strictEqual(overviewRes.status, 200);
  assert.strictEqual(overviewRes.body.totalWidgets, 3); // all three, even though signup/login never have submissions
  assert.strictEqual(overviewRes.body.submissionsByWidget.length, 0); // none have submitted anything
});

test('dashboard overview reports totalVisitors separately from totalSubmissions', async () => {
  const token = await registerTenant('overviewvisitors');
  const widgetId = await createWidget(token, 'signup');

  await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'V', email: `ov-${Date.now()}@example.com`, password: 'password123', confirmPassword: 'password123',
  });

  const overviewRes = await request('GET', '/api/dashboard/overview', null, token);
  assert.strictEqual(overviewRes.body.totalVisitors, 1);
  assert.strictEqual(overviewRes.body.totalSubmissions, 0); // a signup is not a submission
});

// --- Login-widget linking: which signup widget does a login widget authenticate against ---

test('a login widget with ONE signup widget defaults to it automatically, no linking needed', async () => {
  const token = await registerTenant('onesignupdefault');
  const signupWidgetId = await createWidget(token, 'signup');
  const loginWidgetId = await createWidget(token, 'login'); // not linked
  const email = `onesignup-${Date.now()}@example.com`;

  await request('POST', `/widgets/${signupWidgetId}/signup`, {
    name: 'V', email, password: 'password123', confirmPassword: 'password123',
  });

  const loginRes = await request('POST', `/widgets/${loginWidgetId}/login`, { email, password: 'password123' });
  assert.strictEqual(loginRes.status, 200);
});

test('with TWO signup widgets, an unlinked login widget defaults to the FIRST-CREATED one', async () => {
  const token = await registerTenant('twosignupdefault');
  const firstSignupId = await createWidget(token, 'signup');
  const secondSignupId = await createWidget(token, 'signup');
  const loginWidgetId = await createWidget(token, 'login'); // not linked to either

  const emailOnFirst = `first-${Date.now()}@example.com`;
  const emailOnSecond = `second-${Date.now()}@example.com`;

  await request('POST', `/widgets/${firstSignupId}/signup`, {
    name: 'First', email: emailOnFirst, password: 'password123', confirmPassword: 'password123',
  });
  await request('POST', `/widgets/${secondSignupId}/signup`, {
    name: 'Second', email: emailOnSecond, password: 'password123', confirmPassword: 'password123',
  });

  // Unlinked login defaults to the first-created signup widget's accounts.
  const loginFirstRes = await request('POST', `/widgets/${loginWidgetId}/login`, { email: emailOnFirst, password: 'password123' });
  assert.strictEqual(loginFirstRes.status, 200);

  const loginSecondRes = await request('POST', `/widgets/${loginWidgetId}/login`, { email: emailOnSecond, password: 'password123' });
  assert.strictEqual(loginSecondRes.status, 401); // that account lives under the SECOND signup widget, not the default
});

test('explicitly linking a login widget to a specific signup widget makes it authenticate that one', async () => {
  const token = await registerTenant('explicitlink');
  const firstSignupId = await createWidget(token, 'signup');
  const secondSignupId = await createWidget(token, 'signup');

  const loginCreateRes = await request('POST', '/api/widgets', {
    type: 'login', title: 'Sign in',
    displayOptions: { linkedSignupWidgetId: secondSignupId },
  }, token);
  const loginWidgetId = loginCreateRes.body.widget.id;

  const emailOnSecond = `linked-${Date.now()}@example.com`;
  await request('POST', `/widgets/${secondSignupId}/signup`, {
    name: 'On Second', email: emailOnSecond, password: 'password123', confirmPassword: 'password123',
  });

  const loginRes = await request('POST', `/widgets/${loginWidgetId}/login`, { email: emailOnSecond, password: 'password123' });
  assert.strictEqual(loginRes.status, 200); // explicit link honored, even though it's not the first-created signup widget
});

// --- Verification is a 6-digit code, never a link to the platform's own frontend ---

test('verify-email rejects a wrong code', async () => {
  const token = await registerTenant('wrongcode');
  const createRes = await request('POST', '/api/widgets', {
    type: 'signup', title: 'Code Signup', displayOptions: { emailVerificationEnabled: true },
  }, token);
  const widgetId = createRes.body.widget.id;
  const email = `wrongcode-${Date.now()}@example.com`;

  await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'V', email, password: 'password123', confirmPassword: 'password123',
  });

  const res = await request('POST', `/widgets/${widgetId}/verify-email`, { email, code: '000000' });
  assert.strictEqual(res.status, 400);
});

test('verify-email rejects a code that does not match the exact widget it was issued for', async () => {
  const token = await registerTenant('crosswidgetcode');
  const widgetAId = (await request('POST', '/api/widgets', {
    type: 'signup', title: 'A', displayOptions: { emailVerificationEnabled: true },
  }, token)).body.widget.id;
  const widgetBId = (await request('POST', '/api/widgets', {
    type: 'signup', title: 'B', displayOptions: { emailVerificationEnabled: true },
  }, token)).body.widget.id;

  const email = `crosswidgetcode-${Date.now()}@example.com`;
  await request('POST', `/widgets/${widgetAId}/signup`, {
    name: 'V', email, password: 'password123', confirmPassword: 'password123',
  });

  const pendingA = await pendingVisitorsRepo.findByWidgetAndEmail(widgetAId, email);

  // The same code, but presented against widget B's verify-email endpoint — must fail.
  const res = await request('POST', `/widgets/${widgetBId}/verify-email`, { email, code: pendingA.verification_token });
  assert.strictEqual(res.status, 400);
});

test('the verification code is exactly 6 digits, short enough to type by hand', async () => {
  const token = await registerTenant('codeformat');
  const createRes = await request('POST', '/api/widgets', {
    type: 'signup', title: 'Format Check', displayOptions: { emailVerificationEnabled: true },
  }, token);
  const widgetId = createRes.body.widget.id;
  const email = `codeformat-${Date.now()}@example.com`;

  await request('POST', `/widgets/${widgetId}/signup`, {
    name: 'V', email, password: 'password123', confirmPassword: 'password123',
  });

  const pending = await pendingVisitorsRepo.findByWidgetAndEmail(widgetId, email);
  assert.strictEqual(pending.verification_token.length, 6);
  assert.match(pending.verification_token, /^\d{6}$/);
});
