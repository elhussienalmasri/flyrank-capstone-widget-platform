// Same staging pattern as pendingRegistrations, but for `signup`
// widgets that have the per-widget verification checkbox on.
// Deduplicated per WIDGET (not tenant) — matches the same
// widget-scoped identity model as the real widget_visitors table
// (see visitors.repository.js): re-registering the same email on
// the SAME widget just refreshes the pending token, but registering
// on a DIFFERENT widget is a wholly separate pending signup.
import { query } from '../config/db.js';

export async function upsert({ tenantId, widgetId, name, email, passwordHash, verificationToken, verificationExpires }) {
  const { rows } = await query(
    `INSERT INTO pending_widget_visitors (tenant_id, widget_id, name, email, password_hash, verification_token, verification_expires)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (widget_id, email) DO UPDATE SET
       name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash,
       verification_token = EXCLUDED.verification_token,
       verification_expires = EXCLUDED.verification_expires,
       created_at = now()
     RETURNING *`,
    [tenantId, widgetId, name, email, passwordHash, verificationToken, verificationExpires]
  );
  return rows[0];
}

export async function findByToken(token) {
  const { rows } = await query(
    `SELECT * FROM pending_widget_visitors WHERE verification_token = $1 AND verification_expires > now()`,
    [token]
  );
  return rows[0] || null;
}

// The code is looked up together with the widget + email it was
// issued for — it's short (6 digits) and no longer globally unique,
// so a bare code alone isn't enough to identify the right pending
// record (see migration 013).
export async function findByWidgetEmailAndCode(widgetId, email, code) {
  const { rows } = await query(
    `SELECT * FROM pending_widget_visitors
     WHERE widget_id = $1 AND email = $2 AND verification_token = $3 AND verification_expires > now()`,
    [widgetId, email, code]
  );
  return rows[0] || null;
}

// Test-only convenience — a real visitor gets their token from
// their inbox, not a database lookup.
export async function findByWidgetAndEmail(widgetId, email) {
  const { rows } = await query(
    `SELECT * FROM pending_widget_visitors WHERE widget_id = $1 AND email = $2`,
    [widgetId, email]
  );
  return rows[0] || null;
}

export async function deleteById(id) {
  await query('DELETE FROM pending_widget_visitors WHERE id = $1', [id]);
}
