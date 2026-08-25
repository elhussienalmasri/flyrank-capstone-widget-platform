// Staging table for tenant signups when REQUIRE_EMAIL_VERIFICATION
// is on — no real `tenants` row exists until the token is verified.
import { query } from '../config/db.js';

// Upsert by email: a repeated registration attempt (didn't get the
// email, link expired) just refreshes the token instead of erroring
// or piling up duplicate pending rows.
export async function upsert({ companyName, email, passwordHash, verificationToken, verificationExpires }) {
  const { rows } = await query(
    `INSERT INTO pending_registrations (company_name, email, password_hash, verification_token, verification_expires)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET
       company_name = EXCLUDED.company_name,
       password_hash = EXCLUDED.password_hash,
       verification_token = EXCLUDED.verification_token,
       verification_expires = EXCLUDED.verification_expires,
       created_at = now()
     RETURNING *`,
    [companyName, email, passwordHash, verificationToken, verificationExpires]
  );
  return rows[0];
}

export async function findByToken(token) {
  const { rows } = await query(
    `SELECT * FROM pending_registrations WHERE verification_token = $1 AND verification_expires > now()`,
    [token]
  );
  return rows[0] || null;
}

// Test-only convenience — a real user gets their token from their
// inbox, not a database lookup. Used by tests/helpers/request.js so
// registerTenant() keeps working transparently regardless of
// whether REQUIRE_EMAIL_VERIFICATION is on.
export async function findByEmail(email) {
  const { rows } = await query('SELECT * FROM pending_registrations WHERE email = $1', [email]);
  return rows[0] || null;
}

export async function deleteById(id) {
  await query('DELETE FROM pending_registrations WHERE id = $1', [id]);
}
