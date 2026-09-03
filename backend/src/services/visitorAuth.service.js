// Business logic for real visitor accounts (signup/login widgets).
// Mirrors auth.service.js (tenant accounts) but issues a separate
// kind of token — a visitor token carries {visitorId, tenantId,
// widgetId, type:'visitor'}, never a tenantId a tenant-owner route
// would trust, so it can never be used to call the owner-only API.
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { generateToken, generateVerificationCode, hoursFromNow } from '../utils/token.js';
import { getMailer } from '../providers/mailer/index.js';
import { verifyCodeTemplate, resetPasswordTemplate } from './emailTemplates.service.js';
import * as widgetsRepo from '../repositories/widgets.repository.js';
import * as visitorsRepo from '../repositories/visitors.repository.js';
import * as pendingVisitorsRepo from '../repositories/pendingVisitors.repository.js';

const SALT_ROUNDS = 12;

function signVisitorToken(visitor, widgetId) {
  return jwt.sign(
    { visitorId: visitor.id, tenantId: visitor.tenant_id, widgetId, type: 'visitor' },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function toPublicVisitor(visitor) {
  return {
    id: visitor.id,
    name: visitor.name,
    email: visitor.email,
    emailVerified: Boolean(visitor.email_verified),
    createdAt: visitor.created_at,
  };
}

// Verifies that the visitor token belongs to the requested widget and tenant,
// then returns only safe visitor data for the authenticated customer website.
export async function me(widgetId, { visitorId, tenantId, tokenWidgetId }) {
  if (widgetId !== tokenWidgetId) {
    throw new ApiError(403, 'Visitor token is not valid for this widget');
  }

  const widget = await widgetsRepo.findByIdPublic(widgetId);
  if (!widget || widget.tenant_id !== tenantId) {
    throw new ApiError(404, 'Widget not found');
  }

  const visitor = await visitorsRepo.findVisitorById(visitorId);
  if (!visitor || visitor.tenant_id !== tenantId) {
    throw new ApiError(404, 'Visitor not found');
  }

  return toPublicVisitor({ ...visitor, name: visitor.name || '' });
}

// Off by default — the owner opts in per `signup` widget via a
// checkbox stored in that widget's displayOptions. When on, the
// visitor's account is not created until they verify — same
// deferred pattern as tenant registration.
function isEmailVerificationEnabled(widget) {
  return env.emailDeliveryEnabled && Boolean(widget.display_options && widget.display_options.emailVerificationEnabled === true);
}

// A login widget doesn't hold accounts itself — it authenticates
// against ONE signup widget's namespace, since identity is now
// widget-scoped (see visitors.repository.js). Which one:
//   1. Whatever the owner explicitly linked via
//      displayOptions.linkedSignupWidgetId (set through the
//      dashboard — a dropdown when they have more than one signup
//      widget).
//   2. Otherwise, the tenant's FIRST-CREATED signup widget — the
//      documented default so login never breaks silently just
//      because the owner hasn't picked one yet.
// Called with a signup widget itself, this is a no-op (returns it).
async function resolveSignupWidget(widget) {
  if (widget.type === 'signup') return widget;

  const opts = widget.display_options || {};
  if (opts.linkedSignupWidgetId) {
    const linked = await widgetsRepo.findByIdPublic(opts.linkedSignupWidgetId);
    // Only trust the link if it's a real signup widget under the
    // SAME tenant — guards against stale/tampered displayOptions
    // pointing at something that no longer makes sense.
    if (linked && linked.type === 'signup' && linked.tenant_id === widget.tenant_id) {
      return linked;
    }
  }

  const first = await widgetsRepo.findFirstSignupWidgetForTenant(widget.tenant_id);
  return first || widget; // no signup widget exists at all — nothing to resolve to
}

async function sendVerificationCodeTo(email, code) {
  const mailer = getMailer();
  try {
    await mailer.send({
      to: email,
      subject: 'Verify your email address',
      body: `Your verification code is: ${code}`,
      html: verifyCodeTemplate({ code }),
    });
  } catch (err) {
    console.error('[visitorAuth] failed to send verification email:', err.message);
  }
}

export async function signup(widgetId, { name, email, password }) {
  const widget = await widgetsRepo.findByIdPublic(widgetId);
  if (!widget) throw new ApiError(404, 'Widget not found');

  // Scoped to THIS widget, not the whole tenant — signing up on a
  // different signup widget under the same tenant with the same
  // email is a separate account, not a duplicate.
  const existing = await visitorsRepo.findByEmailForWidget(widgetId, email);
  if (existing) throw new ApiError(409, 'An account with that email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const verificationEnabled = isEmailVerificationEnabled(widget);

  if (verificationEnabled) {
    // No widget_visitors row yet — stage it, email a short code, and
    // only create the real account once it's entered. A clickable
    // link would send the visitor to the PLATFORM's own frontend —
    // a page they never otherwise visit — instead of keeping the
    // whole flow on the customer's site where the widget lives.
    const verificationCode = generateVerificationCode();
    const verificationExpires = hoursFromNow(24);
    await pendingVisitorsRepo.upsert({
      tenantId: widget.tenant_id,
      widgetId,
      name,
      email,
      passwordHash,
      verificationToken: verificationCode,
      verificationExpires,
    });
    await sendVerificationCodeTo(email, verificationCode);
    return { pending: true };
  }

  // Verification not enabled for this widget — create immediately.
  const visitor = await visitorsRepo.create({ tenantId: widget.tenant_id, widgetId, name, email, passwordHash });
  const token = signVisitorToken(visitor, widgetId);
  return { pending: false, visitor: toPublicVisitor(visitor), token };
}

export async function login(widgetId, { email, password }) {
  const widget = await widgetsRepo.findByIdPublic(widgetId);
  if (!widget) throw new ApiError(404, 'Widget not found');

  const signupWidget = await resolveSignupWidget(widget);
  const visitor = await visitorsRepo.findByEmailForWidget(signupWidget.id, email);

  // Same error for "no such account" and "wrong password" — same
  // rule as the owner-account login, avoids user enumeration.
  if (!visitor) throw new ApiError(401, 'Invalid email or password');

  const matches = await bcrypt.compare(password, visitor.password_hash);
  if (!matches) throw new ApiError(401, 'Invalid email or password');

  const token = signVisitorToken(visitor, widgetId);
  return { visitor: toPublicVisitor({ ...visitor, name: visitor.name || '' }), token };
}

export async function verifyEmail(widgetId, { email, code }) {
  const widget = await widgetsRepo.findByIdPublic(widgetId);
  if (!widget) throw new ApiError(404, 'Widget not found');
  if (!isEmailVerificationEnabled(widget)) {
    throw new ApiError(403, 'Email verification is not enabled for this widget');
  }

  const pending = await pendingVisitorsRepo.findByWidgetEmailAndCode(widgetId, email, code);
  if (!pending) {
    throw new ApiError(400, 'That code is invalid or has expired');
  }

  const visitor = await visitorsRepo.create({
    tenantId: pending.tenant_id,
    widgetId: pending.widget_id,
    name: pending.name,
    email: pending.email,
    passwordHash: pending.password_hash,
  });
  await visitorsRepo.markEmailVerified(visitor.id);
  await pendingVisitorsRepo.deleteById(pending.id);

  const verifiedVisitor = { ...visitor, email_verified: true };
  const authToken = signVisitorToken(verifiedVisitor, widgetId);
  return { verified: true, visitor: toPublicVisitor({ ...verifiedVisitor, name: verifiedVisitor.name || '' }), token: authToken };
}

export async function forgotPassword(widgetId, email) {
  const widget = await widgetsRepo.findByIdPublic(widgetId);
  if (!widget) throw new ApiError(404, 'Widget not found');

  // The verification/reset toggle lives on the SIGNUP widget's
  // config, not necessarily on the widget whose URL was called —
  // resolve there first (a no-op if `widget` already IS the signup widget).
  const signupWidget = await resolveSignupWidget(widget);
  if (!isEmailVerificationEnabled(signupWidget)) {
    throw new ApiError(403, 'Password reset by email is not enabled for this widget');
  }

  const visitor = await visitorsRepo.findByEmailForWidget(signupWidget.id, email);
  // Same response whether or not the account exists — avoids
  // leaking which emails are registered.
  if (!visitor) return { sent: true };

  const token = generateToken();
  const expires = hoursFromNow(1);
  await visitorsRepo.setPasswordResetToken(visitor.id, token, expires);

  const url = `${env.frontendBaseUrl}/widget-reset-password?token=${token}&widgetId=${widgetId}`;
  const mailer = getMailer();
  try {
    await mailer.send({
      to: visitor.email,
      subject: 'Reset your password',
      body: `Reset your password: ${url}`,
      html: resetPasswordTemplate({ url }),
    });
  } catch (err) {
    console.error('[visitorAuth] failed to send password reset email:', err.message);
  }

  return { sent: true };
}

export async function resetPassword(widgetId, token, newPassword) {
  const widget = await widgetsRepo.findByIdPublic(widgetId);
  if (!widget) throw new ApiError(404, 'Widget not found');

  const signupWidget = await resolveSignupWidget(widget);
  if (!isEmailVerificationEnabled(signupWidget)) {
    throw new ApiError(403, 'Password reset by email is not enabled for this widget');
  }

  const visitor = await visitorsRepo.findByResetToken(token);
  if (!visitor) throw new ApiError(400, 'This reset link is invalid or has expired');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await visitorsRepo.updatePassword(visitor.id, passwordHash);
  return { reset: true };
}
