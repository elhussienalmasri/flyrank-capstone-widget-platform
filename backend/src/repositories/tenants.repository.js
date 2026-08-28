// Only file allowed to write raw SQL for tenants.
import { query } from '../config/db.js';

// SELECT * here (not a curated column list) because this function
// backs both login (needs password_hash) and the verification/reset
// token lookups below — the service layer is responsible for never
// leaking password_hash or raw tokens back to a client.
export async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM tenants WHERE email = $1', [email]);
  return rows[0] || null;
}

export async function findById(id) {
  const { rows } = await query(
    'SELECT id, company_name, email, role, email_verified, created_at FROM tenants WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

// Admin-only — every tenant account on the platform, newest first.
// Excludes admin accounts themselves from the listing — the admin
// managing accounts isn't "an account to manage".
export async function findAll() {
  const { rows } = await query(
    `SELECT id, company_name, email, role, email_verified, created_at
     FROM tenants WHERE role = 'owner' ORDER BY created_at DESC`
  );
  return rows;
}

export async function create({ companyName, email, passwordHash, verificationToken, verificationExpires }) {
  const { rows } = await query(
    `INSERT INTO tenants (company_name, email, password_hash, email_verification_token, email_verification_expires)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, company_name, email, role, email_verified, created_at`,
    [companyName, email, passwordHash, verificationToken || null, verificationExpires || null]
  );
  return rows[0];
}

// Used only by ensureAdminAccount() at boot — creates the single
// platform-admin row from ADMIN_EMAIL/ADMIN_PASSWORD. Pre-verified,
// since there's no one to click a verification link on its behalf.
export async function createAdmin({ email, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO tenants (company_name, email, password_hash, role, email_verified)
     VALUES ('Platform Admin', $1, $2, 'admin', true)
     RETURNING id, company_name, email, role, email_verified, created_at`,
    [email, passwordHash]
  );
  return rows[0];
}

export async function promoteToAdmin(id) {
  await query(`UPDATE tenants SET role = 'admin' WHERE id = $1`, [id]);
}

export async function findByVerificationToken(token) {
  const { rows } = await query(
    `SELECT * FROM tenants WHERE email_verification_token = $1 AND email_verification_expires > now()`,
    [token]
  );
  return rows[0] || null;
}

export async function markEmailVerified(id) {
  await query(
    `UPDATE tenants SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL
     WHERE id = $1`,
    [id]
  );
}

export async function setPasswordResetToken(id, token, expires) {
  await query(
    `UPDATE tenants SET password_reset_token = $2, password_reset_expires = $3 WHERE id = $1`,
    [id, token, expires]
  );
}

export async function findByResetToken(token) {
  const { rows } = await query(
    `SELECT * FROM tenants WHERE password_reset_token = $1 AND password_reset_expires > now()`,
    [token]
  );
  return rows[0] || null;
}

export async function updatePassword(id, passwordHash) {
  await query(
    `UPDATE tenants SET password_hash = $2, password_reset_token = NULL, password_reset_expires = NULL
     WHERE id = $1`,
    [id, passwordHash]
  );
}

// Cascades to widgets, submissions, and widget_visitors via the
// ON DELETE CASCADE foreign keys set up in earlier migrations.
export async function deleteById(id) {
  const { rowCount } = await query('DELETE FROM tenants WHERE id = $1', [id]);
  return rowCount > 0;
}
