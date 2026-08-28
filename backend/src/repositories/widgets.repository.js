// Only file allowed to write raw SQL for widgets. Every query is
// scoped by tenant_id where the caller is an owner — but
// findByIdPublic is the one exception, used by the public config
// endpoint, which deliberately does NOT check tenant_id (any
// visitor on any site must be able to fetch a widget's config).
import { query } from '../config/db.js';

export async function create({ tenantId, type, title, description, buttonText, formFields, displayOptions }) {
  const { rows } = await query(
    `INSERT INTO widgets (tenant_id, type, title, description, button_text, form_fields, display_options)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [tenantId, type, title, description, buttonText, JSON.stringify(formFields), JSON.stringify(displayOptions)]
  );
  return rows[0];
}

export async function findAllByTenant(tenantId) {
  const { rows } = await query(
    `SELECT * FROM widgets WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return rows;
}

// Owner-scoped lookup — used by the authenticated CRUD routes.
export async function findByIdForTenant(id, tenantId) {
  const { rows } = await query(
    `SELECT * FROM widgets WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return rows[0] || null;
}

// Public lookup — used by the public config endpoint. No tenant
// check: any widget id is fetchable by any visitor, by design —
// that's the whole point of an embeddable widget.
export async function findByIdPublic(id) {
  const { rows } = await query(`SELECT * FROM widgets WHERE id = $1`, [id]);
  return rows[0] || null;
}

// Used to resolve which account-namespace a login widget
// authenticates against when the owner hasn't explicitly linked it
// to one of their signup widgets yet — see resolveSignupWidget() in
// visitorAuth.service.js.
export async function findFirstSignupWidgetForTenant(tenantId) {
  const { rows } = await query(
    `SELECT * FROM widgets WHERE tenant_id = $1 AND type = 'signup' ORDER BY created_at ASC LIMIT 1`,
    [tenantId]
  );
  return rows[0] || null;
}

export async function updateByIdForTenant(id, tenantId, fields) {
  const columns = {
    type: 'type',
    title: 'title',
    description: 'description',
    buttonText: 'button_text',
    formFields: 'form_fields',
    displayOptions: 'display_options',
  };

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, column] of Object.entries(columns)) {
    if (fields[key] === undefined) continue;
    const value = key === 'formFields' || key === 'displayOptions' ? JSON.stringify(fields[key]) : fields[key];
    setClauses.push(`${column} = $${paramIndex}`);
    values.push(value);
    paramIndex += 1;
  }

  if (setClauses.length === 0) {
    return findByIdForTenant(id, tenantId);
  }

  setClauses.push(`updated_at = now()`);
  values.push(id, tenantId);

  const { rows } = await query(
    `UPDATE widgets SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );
  return rows[0] || null;
}

export async function deleteByIdForTenant(id, tenantId) {
  const { rowCount } = await query(`DELETE FROM widgets WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
  return rowCount > 0;
}
