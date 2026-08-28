import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { generateToken, hoursFromNow } from '../utils/token.js';
import { getMailer } from '../providers/mailer/index.js';
import { verifyEmailTemplate, resetPasswordTemplate } from './emailTemplates.service.js';
import * as tenantsRepo from '../repositories/tenants.repository.js';
import * as pendingRegistrationsRepo from '../repositories/pendingRegistrations.repository.js';

const SALT_ROUNDS = 12;

function signToken(tenant) {
  return jwt.sign(
    { tenantId: tenant.id, email: tenant.email, role: tenant.role || 'owner' },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function toPublicTenant(tenant) {
  return {
    id: tenant.id,
    companyName: tenant.company_name,
    email: tenant.email,
    role: tenant.role || 'owner',
    emailVerified: Boolean(tenant.email_verified),
    createdAt: tenant.created_at,
  };
}

async function sendVerificationEmailTo(email, token) {
  const url = `${env.frontendBaseUrl}/verify-email?token=${token}`;
  const mailer = getMailer();
  try {
    await mailer.send({
      to: email,
      subject: 'Verify your email address',
      body: `Verify your email: ${url}`,
      html: verifyEmailTemplate({ url }),
    });
  } catch (err) {
    // Never let a failed verification email break registration.
    console.error('[auth] failed to send verification email:', err.message);
  }
}

// Called once at boot (see server.js). The platform admin is just a
// tenant row with role='admin' — no separate admin table, no
// separate login. If ADMIN_EMAIL/ADMIN_PASSWORD aren't set, no admin
// account exists and /api/admin/* stays unreachable by anyone.
export async function ensureAdminAccount() {
  if (!env.adminEmail || !env.adminPassword) {
    console.warn('[auth] ADMIN_EMAIL/ADMIN_PASSWORD not set — no admin account will exist');
    return;
  }

  const existing = await tenantsRepo.findByEmail(env.adminEmail);
  if (existing) {
    if (existing.role !== 'admin') {
      await tenantsRepo.promoteToAdmin(existing.id);
      console.log(`[auth] promoted existing account ${env.adminEmail} to admin`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, SALT_ROUNDS);
  await tenantsRepo.createAdmin({ email: env.adminEmail, passwordHash });
  console.log(`[auth] created admin account for ${env.adminEmail}`);
}

export async function register({ companyName, email, password }) {
  const existingTenant = await tenantsRepo.findByEmail(email);
  if (existingTenant) {
    throw new ApiError(409, 'An account with that email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Verification required before the account is created at all —
  // stage the signup instead of creating a tenant row yet.
  if (env.emailFeaturesEnabled && env.requireEmailVerificationForSignup) {
    const verificationToken = generateToken();
    const verificationExpires = hoursFromNow(24);
    await pendingRegistrationsRepo.upsert({ companyName, email, passwordHash, verificationToken, verificationExpires });
    await sendVerificationEmailTo(email, verificationToken);
    return { pending: true };
  }

  // Verification off (or email delivery disabled entirely) —
  // create the account immediately, as before.
  let verificationToken = null;
  let verificationExpires = null;
  if (env.emailFeaturesEnabled) {
    verificationToken = generateToken();
    verificationExpires = hoursFromNow(24);
  }

  const tenant = await tenantsRepo.create({ companyName, email, passwordHash, verificationToken, verificationExpires });
  if (env.emailFeaturesEnabled) {
    await sendVerificationEmailTo(email, verificationToken);
  }

  const token = signToken(tenant);
  return { pending: false, tenant: toPublicTenant(tenant), token };
}

export async function login({ email, password }) {
  const tenant = await tenantsRepo.findByEmail(email);

  if (!tenant) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const matches = await bcrypt.compare(password, tenant.password_hash);
  if (!matches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(tenant);
  return { tenant: toPublicTenant(tenant), token };
}

export async function getById(tenantId) {
  const tenant = await tenantsRepo.findById(tenantId);
  if (!tenant) {
    throw new ApiError(404, 'Account not found');
  }
  return toPublicTenant(tenant);
}

export async function verifyEmail(token) {
  if (!env.emailFeaturesEnabled) {
    throw new ApiError(403, 'Email verification is disabled on this platform');
  }

  // Check the pending-registration flow first (verification-required
  // signups) — if found, THIS is the moment the real account gets
  // created, and we log them straight in.
  const pending = await pendingRegistrationsRepo.findByToken(token);
  if (pending) {
    const tenant = await tenantsRepo.create({
      companyName: pending.company_name,
      email: pending.email,
      passwordHash: pending.password_hash,
      verificationToken: null,
      verificationExpires: null,
    });
    await tenantsRepo.markEmailVerified(tenant.id);
    await pendingRegistrationsRepo.deleteById(pending.id);

    const verifiedTenant = { ...tenant, email_verified: true };
    const authToken = signToken(verifiedTenant);
    return { verified: true, created: true, tenant: toPublicTenant(verifiedTenant), token: authToken };
  }

  // Otherwise, this is the "verification optional" flow — the
  // account already exists, this just flips the verified flag.
  const tenant = await tenantsRepo.findByVerificationToken(token);
  if (!tenant) {
    throw new ApiError(400, 'This verification link is invalid or has expired');
  }

  await tenantsRepo.markEmailVerified(tenant.id);
  return { verified: true, created: false };
}

export async function forgotPassword(email) {
  if (!env.emailFeaturesEnabled) {
    throw new ApiError(403, 'Password reset by email is disabled on this platform');
  }

  const tenant = await tenantsRepo.findByEmail(email);
  // Always respond the same way whether or not the account exists —
  // otherwise this endpoint becomes a way to check which emails are
  // registered (user enumeration).
  if (!tenant) return { sent: true };

  const token = generateToken();
  const expires = hoursFromNow(1);
  await tenantsRepo.setPasswordResetToken(tenant.id, token, expires);

  const url = `${env.frontendBaseUrl}/reset-password?token=${token}`;
  const mailer = getMailer();
  try {
    await mailer.send({
      to: tenant.email,
      subject: 'Reset your password',
      body: `Reset your password: ${url}`,
      html: resetPasswordTemplate({ url }),
    });
  } catch (err) {
    console.error('[auth] failed to send password reset email:', err.message);
  }

  return { sent: true };
}

export async function resetPassword(token, newPassword) {
  if (!env.emailFeaturesEnabled) {
    throw new ApiError(403, 'Password reset by email is disabled on this platform');
  }

  const tenant = await tenantsRepo.findByResetToken(token);
  if (!tenant) {
    throw new ApiError(400, 'This reset link is invalid or has expired');
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await tenantsRepo.updatePassword(tenant.id, passwordHash);
  return { reset: true };
}

// Unlike forgot/reset, this needs no email delivery — the user is
// already logged in and proves identity with their current
// password — so it works regardless of emailFeaturesEnabled.
export async function changePassword(tenantId, currentPassword, newPassword) {
  const tenant = await tenantsRepo.findById(tenantId);
  if (!tenant) throw new ApiError(404, 'Account not found');

  // findById() intentionally excludes password_hash (see repository),
  // so re-fetch by email to verify the current password.
  const full = await tenantsRepo.findByEmail(tenant.email);
  const matches = await bcrypt.compare(currentPassword, full.password_hash);
  if (!matches) throw new ApiError(401, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await tenantsRepo.updatePassword(tenantId, passwordHash);
  return { changed: true };
}
