// Orchestrates the full hardened submission path:
// validate (already done by Zod at the boundary) -> confirm widget
// exists -> spam check -> enrich -> store -> notify (best-effort).
// Order matters: spam check is cheap and runs before any network
// call; storing happens before the side effect so a failing email
// can never lose the submission.
import ApiError from '../utils/ApiError.js';
import * as widgetsService from './widgets.service.js';
import * as submissionsRepo from '../repositories/submissions.repository.js';
import * as tenantsRepo from '../repositories/tenants.repository.js';
import { isSpam, HONEYPOT_FIELD } from './spam.service.js';
import { enrich } from './enrichment.service.js';
import { notifySubmission } from './notify.service.js';

function toPublicSubmission(row) {
  return {
    id: row.id,
    widgetId: row.widget_id,
    fields: row.fields,
    geo: row.geo_country ? { country: row.geo_country, city: row.geo_city, provider: row.geo_provider } : null,
    notified: row.notified,
    createdAt: row.created_at,
  };
}

// Real per-field validation against the widget's own configuration —
// this was previously missing entirely: a widget's `required` flags
// on formFields were only ever enforced client-side (skippable by
// anyone who calls the API directly). Two rules:
//   1. Every field the owner marked required must have a non-empty value.
//   2. Even if NOTHING is marked required (e.g. a contact form where
//      name/email/message are all optional individually), the
//      submission still can't be entirely empty — at least one field
//      must be filled, or there's nothing to act on.
function validateAgainstWidgetFields(widget, fields) {
  const formFields = widget.form_fields || [];
  const valueFor = (name) => String(fields[name] ?? '').trim();

  const missingRequired = formFields.filter((f) => f.required && !valueFor(f.name));
  if (missingRequired.length > 0) {
    throw new ApiError(
      400,
      'Missing required field(s)',
      missingRequired.map((f) => ({ field: f.name, message: `${f.label || f.name} is required` }))
    );
  }

  const relevantEntries = Object.entries(fields).filter(([key]) => key !== HONEYPOT_FIELD);
  const anyFilled = relevantEntries.some(([, value]) => String(value ?? '').trim().length > 0);
  if (!anyFilled) {
    throw new ApiError(400, 'At least one field must be filled');
  }
}

export async function submit({ widgetId, fields, ipAddress }) {
  const widget = await widgetsService.assertWidgetExists(widgetId); // 404 if the widget doesn't exist

  validateAgainstWidgetFields(widget, fields); // real 400s — a legitimate user deserves an honest error

  if (isSpam(fields)) {
    // Silently drop — never tell a bot *why* it was rejected, and
    // never store spam rows. Reported to the caller as a normal
    // success shape so a scripted bot can't distinguish "accepted"
    // from "silently dropped" by response shape alone.
    return { dropped: true };
  }

  // The honeypot is purely an internal bot trap (isSpam already
  // consumed it above) — it was never part of the widget's real
  // formFields and must never reach storage, the dashboard, or the
  // notification email. Strip it here, once, so every downstream
  // consumer only ever sees the fields the owner actually configured.
  const cleanFields = { ...fields };
  delete cleanFields[HONEYPOT_FIELD];

  const geo = await enrich(ipAddress); // never throws — degrades to nulls

  const row = await submissionsRepo.create({
    widgetId,
    tenantId: widget.tenant_id,
    fields: cleanFields,
    ipAddress,
    geoCountry: geo.country,
    geoCity: geo.city,
    geoProvider: geo.provider,
    notified: false, // updated below, but the row exists either way
  });

  // Safe side effect — its failure must never surface as an error
  // to the visitor, and must never undo the already-stored row.
  // Notify the tenant's REAL email, not a placeholder — looked up
  // fresh here rather than carried on the widget row, since it can
  // change (the owner's own email is the source of truth).
  const tenant = await tenantsRepo.findById(widget.tenant_id);
  const notified = await notifySubmission({
    widgetTitle: widget.title,
    fields: cleanFields,
    to: tenant ? tenant.email : null,
  });

  return { dropped: false, submission: toPublicSubmission({ ...row, notified }) };
}

export async function listForTenant(tenantId, filters) {
  const rows = await submissionsRepo.findAllByTenant(tenantId, filters);
  return rows.map(toPublicSubmission);
}
