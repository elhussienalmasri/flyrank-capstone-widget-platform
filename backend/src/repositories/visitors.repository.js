// Only file allowed to write raw SQL for widget_visitors.
//
// Two different lookups, two different scopes, on purpose:
//   - findByEmailForWidget: used to check for a duplicate SIGNUP —
//     scoped to one widget, so the same email can hold separate
//     accounts on two different signup widgets under the same tenant.
//   - findByEmailForTenant: used for LOGIN — stays tenant-wide, so a
//     separate login widget can still authenticate an account
//     regardless of which signup widget created it. If the same
//     email now exists on more than one widget, this resolves to
//     the most recently created match (deterministic, not ambiguous).
import { query } from '../config/db.js';

export async function findByEmailForWidget(widgetId, email) {
  const { rows } = await query(
    `SELECT * FROM widget_visitors WHERE widget_id = $1 AND email = $2`,
    [widgetId, email]
  );
  return rows[0] || null;
}

// Finds one visitor account by its unique visitor ID.
export async function findVisitorById(visitorId) {
  const { rows } = await query('SELECT * FROM widget_visitors WHERE id = $1', [visitorId]);
  return rows[0] || null;
}

export async function findByEmailForTenant(tenantId, email) {
  const { rows } = await query(
    `SELECT * FROM widget_visitors WHERE tenant_id = $1 AND email = $2
     ORDER BY created_at DESC LIMIT 1`,
    [tenantId, email]
  );
  return rows[0] || null;
}

export async function countByTenant(tenantId) {
  const { rows } = await query(
    `SELECT count(*)::int AS count FROM widget_visitors WHERE tenant_id = $1`,
    [tenantId]
  );
  return rows[0].count;
}

export async function findAllByTenant(tenantId, { widgetId } = {}) {
  if (widgetId) {
    const { rows } = await query(
      `SELECT * FROM widget_visitors WHERE tenant_id = $1 AND widget_id = $2 ORDER BY created_at DESC`,
      [tenantId, widgetId]
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT * FROM widget_visitors WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return rows;
}

export async function create({ tenantId, widgetId, name, email, passwordHash, verificationToken, verificationExpires }) {
  const { rows } = await query(
    `INSERT INTO widget_visitors (tenant_id, widget_id, name, email, password_hash, email_verification_token, email_verification_expires)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [tenantId, widgetId || null, name, email, passwordHash, verificationToken || null, verificationExpires || null]
  );
  return rows[0];
}

export async function findByVerificationToken(token) {
  const { rows } = await query(
    `SELECT * FROM widget_visitors WHERE email_verification_token = $1 AND email_verification_expires > now()`,
    [token]
  );
  return rows[0] || null;
}

export async function markEmailVerified(id) {
  await query(
    `UPDATE widget_visitors
     SET email_verified = true, email_verification_token = NULL, email_verification_expires = NULL
     WHERE id = $1`,
    [id]
  );
}

export async function setPasswordResetToken(id, token, expires) {
  await query(
    `UPDATE widget_visitors SET password_reset_token = $2, password_reset_expires = $3 WHERE id = $1`,
    [id, token, expires]
  );
}

export async function findByResetToken(token) {
  const { rows } = await query(
    `SELECT * FROM widget_visitors WHERE password_reset_token = $1 AND password_reset_expires > now()`,
    [token]
  );
  return rows[0] || null;
}

export async function updatePassword(id, passwordHash) {
  await query(
    `UPDATE widget_visitors SET password_hash = $2, password_reset_token = NULL, password_reset_expires = NULL
     WHERE id = $1`,
    [id, passwordHash]
  );
}

// Scoped by BOTH id and tenant_id, same pattern as widgets/submissions
// — a visitor belonging to another tenant returns "not deleted"
// rather than ever touching a row that isn't the caller's.
export async function deleteByIdForTenant(id, tenantId) {
  const { rowCount } = await query(
    `DELETE FROM widget_visitors WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return rowCount > 0;
}
