// Owner dashboard: aggregation only, no raw submission
// dumps beyond what's needed. All queries scoped by tenant_id via
// the repository layer.
import * as submissionsRepo from '../repositories/submissions.repository.js';
import * as widgetsRepo from '../repositories/widgets.repository.js';
import * as visitorsRepo from '../repositories/visitors.repository.js';
import ApiError from '../utils/ApiError.js';

export async function getOverview(tenantId) {
  const [totalSubmissionsCount, byDay, byWidget, byGeo, widgets, totalVisitorsCount] = await Promise.all([
    submissionsRepo.countByTenant(tenantId),
    submissionsRepo.countByDayForTenant(tenantId, 14),
    submissionsRepo.countByWidgetForTenant(tenantId),
    submissionsRepo.countByGeoForTenant(tenantId),
    widgetsRepo.findAllByTenant(tenantId),
    visitorsRepo.countByTenant(tenantId),
  ]);

  const widgetTitleById = Object.fromEntries(widgets.map((w) => [w.id, w.title]));

  return {
    totalSubmissions: totalSubmissionsCount,
    // ALL widgets the tenant owns, regardless of type — previously
    // this was derived from submissionsByWidget.length, which only
    // ever counted widgets with at least one submission and so
    // silently excluded every signup/login widget (they never
    // produce submission rows). This is the real total.
    totalWidgets: widgets.length,
    totalVisitors: totalVisitorsCount,
    submissionsByDay: byDay.map((row) => ({ day: row.day, count: row.count })),
    submissionsByWidget: byWidget.map((row) => ({
      widgetId: row.widget_id,
      widgetTitle: widgetTitleById[row.widget_id] || '(deleted widget)',
      count: row.count,
    })),
    submissionsByCountry: byGeo.map((row) => ({ country: row.geo_country, count: row.count })),
  };
}

export async function listSubmissions(tenantId, { widgetId } = {}) {
  const rows = await submissionsRepo.findAllByTenant(tenantId, { widgetId });
  return rows.map((row) => ({
    id: row.id,
    widgetId: row.widget_id,
    fields: row.fields,
    geo: row.geo_country ? { country: row.geo_country, city: row.geo_city } : null,
    notified: row.notified,
    createdAt: row.created_at,
  }));
}

// Registered accounts from `signup` widgets — deliberately excludes
// password_hash. There's no separate "login" list: logging in only
// verifies against an existing row here, it never creates one, so
// there's nothing distinct to show for it. Optional widgetId filter
// narrows to visitors who signed up through one specific widget.
export async function listVisitors(tenantId, { widgetId } = {}) {
  const rows = await visitorsRepo.findAllByTenant(tenantId, { widgetId });
  return rows.map((row) => ({
    id: row.id,
    widgetId: row.widget_id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  }));
}

export async function deleteSubmission(tenantId, id) {
  const deleted = await submissionsRepo.deleteByIdForTenant(id, tenantId);
  if (!deleted) throw new ApiError(404, 'Submission not found');
}

export async function deleteVisitor(tenantId, id) {
  const deleted = await visitorsRepo.deleteByIdForTenant(id, tenantId);
  if (!deleted) throw new ApiError(404, 'Visitor not found');
}
