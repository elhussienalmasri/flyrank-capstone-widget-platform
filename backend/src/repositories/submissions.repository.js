// Only file allowed to write raw SQL for submissions.
import { query } from '../config/db.js';

export async function create({ widgetId, tenantId, fields, ipAddress, geoCountry, geoCity, geoProvider, notified }) {
  const { rows } = await query(
    `INSERT INTO submissions (widget_id, tenant_id, fields, ip_address, geo_country, geo_city, geo_provider, notified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [widgetId, tenantId, JSON.stringify(fields), ipAddress, geoCountry, geoCity, geoProvider, notified]
  );
  return rows[0];
}

export async function findAllByTenant(tenantId, { widgetId } = {}) {
  if (widgetId) {
    const { rows } = await query(
      `SELECT * FROM submissions WHERE tenant_id = $1 AND widget_id = $2 ORDER BY created_at DESC`,
      [tenantId, widgetId]
    );
    return rows;
  }
  const { rows } = await query(
    `SELECT * FROM submissions WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );
  return rows;
}

export async function countByTenant(tenantId) {
  const { rows } = await query(`SELECT count(*)::int AS count FROM submissions WHERE tenant_id = $1`, [tenantId]);
  return rows[0].count;
}

// Counts grouped by day, for the last N days — powers the
// "submissions over time" dashboard chart.
export async function countByDayForTenant(tenantId, days = 14) {
  const { rows } = await query(
    `SELECT date_trunc('day', created_at) AS day, count(*)::int AS count
     FROM submissions
     WHERE tenant_id = $1 AND created_at >= now() - ($2 || ' days')::interval
     GROUP BY day
     ORDER BY day ASC`,
    [tenantId, days]
  );
  return rows;
}

export async function countByWidgetForTenant(tenantId) {
  const { rows } = await query(
    `SELECT widget_id, count(*)::int AS count
     FROM submissions
     WHERE tenant_id = $1
     GROUP BY widget_id
     ORDER BY count DESC`,
    [tenantId]
  );
  return rows;
}

export async function countByGeoForTenant(tenantId) {
  const { rows } = await query(
    `SELECT geo_country, count(*)::int AS count
     FROM submissions
     WHERE tenant_id = $1 AND geo_country IS NOT NULL
     GROUP BY geo_country
     ORDER BY count DESC`,
    [tenantId]
  );
  return rows;
}

// Scoped by BOTH id and tenant_id, same pattern as widgets — a
// submission belonging to another tenant returns "not deleted"
// rather than ever touching a row that isn't the caller's.
export async function deleteByIdForTenant(id, tenantId) {
  const { rowCount } = await query(
    `DELETE FROM submissions WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );
  return rowCount > 0;
}
