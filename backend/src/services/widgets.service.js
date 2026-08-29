// Business logic for widgets: ownership checks, shaping responses,
// and generating the embed snippet. No SQL, no HTTP.
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import * as widgetsRepo from '../repositories/widgets.repository.js';

// Applied only when the owner doesn't supply their own formFields.
// subscribe/signup/login have a fixed, sensible shape (you can't
// really configure your way to a working login form without email
// + password) — cta/popover are intentionally left empty, since
// the whole point of those two types is the owner picks their own
// fields and decides which are required.
const DEFAULT_FIELDS_BY_TYPE = {
  subscribe: [{ name: 'email', label: 'Email', type: 'email', required: true }],
  signup: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Password', type: 'password', required: true },
    { name: 'confirmPassword', label: 'Confirm password', type: 'password', required: true },
  ],
  login: [
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Password', type: 'password', required: true },
  ],
  cta: [],
  popover: [],
};

function buildEmbedSnippet(widgetId) {
  return `<script src="${env.appBaseUrl}/widget.js?id=${widgetId}"></script>`;
}

function toPublicWidget(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    buttonText: row.button_text,
    formFields: row.form_fields,
    displayOptions: row.display_options,
    embedSnippet: buildEmbedSnippet(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Shaped for the PUBLIC config endpoint — deliberately
// excludes tenant_id and anything the owner-only view exposes that
// a random visitor's browser has no business seeing.
function toPublicConfig(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    buttonText: row.button_text,
    formFields: row.form_fields,
    displayOptions: row.display_options,
  };
}

// Types where the owner picks their own fields via the field editor
// (cta/popover start empty by design — subscribe/signup/login have
// a fixed shape, so they can never end up with zero fields). A
// widget of one of these types with zero fields would be genuinely
// broken: the embedded form would render nothing to fill in, and
// every submission would fail the "at least one field" check.
const CUSTOM_FIELD_TYPES = new Set(['subscribe', 'cta', 'popover']);

function assertHasAtLeastOneField(type, formFields) {
  if (CUSTOM_FIELD_TYPES.has(type) && formFields.length === 0) {
    throw new ApiError(400, 'This widget needs at least one field — add one before saving.');
  }
}

// subscribe is deliberately locked down, not freely configurable
// like cta/popover: at most 2 fields, and only "name"/"email" are
// allowed. A subscribe widget is a lightweight mailing-list
// signup by design — anything more belongs on a cta widget instead.
const SUBSCRIBE_ALLOWED_FIELD_NAMES = new Set(['name', 'email']);

function assertValidSubscribeFields(formFields) {
  if (formFields.length > 2) {
    throw new ApiError(400, 'Subscribe widgets support at most 2 fields (name and email).');
  }
  const invalidField = formFields.find((f) => !SUBSCRIBE_ALLOWED_FIELD_NAMES.has(f.name));
  if (invalidField) {
    throw new ApiError(400, `Subscribe widgets only support "name" and "email" fields (got "${invalidField.name}").`);
  }
  const hasEmail = formFields.some((f) => f.name === 'email');
  if (!hasEmail) {
    throw new ApiError(400, 'Subscribe widgets must include an email field.');
  }
}

export async function create(tenantId, values) {
  const formFields = values.formFields && values.formFields.length > 0
    ? values.formFields
    : (DEFAULT_FIELDS_BY_TYPE[values.type] || []);

  assertHasAtLeastOneField(values.type, formFields);
  if (values.type === 'subscribe') assertValidSubscribeFields(formFields);

  const row = await widgetsRepo.create({ tenantId, ...values, formFields });
  return toPublicWidget(row);
}

export async function listForTenant(tenantId) {
  const rows = await widgetsRepo.findAllByTenant(tenantId);
  return rows.map(toPublicWidget);
}

export async function getForTenant(tenantId, id) {
  const row = await widgetsRepo.findByIdForTenant(id, tenantId);
  if (!row) throw new ApiError(404, 'Widget not found');
  return toPublicWidget(row);
}

export async function updateForTenant(tenantId, id, values) {
  const existing = await widgetsRepo.findByIdForTenant(id, tenantId);
  if (!existing) throw new ApiError(404, 'Widget not found');

  // Validate against the EFFECTIVE post-update state — whichever of
  // type/formFields the owner didn't touch in this request still
  // comes from the existing row, so e.g. changing only the title
  // never accidentally trips this on fields that were already fine.
  const effectiveType = values.type !== undefined ? values.type : existing.type;
  const effectiveFormFields = values.formFields !== undefined ? values.formFields : existing.form_fields;
  assertHasAtLeastOneField(effectiveType, effectiveFormFields);
  if (effectiveType === 'subscribe') assertValidSubscribeFields(effectiveFormFields);

  const updated = await widgetsRepo.updateByIdForTenant(id, tenantId, values);
  return toPublicWidget(updated);
}

export async function deleteForTenant(tenantId, id) {
  const deleted = await widgetsRepo.deleteByIdForTenant(id, tenantId);
  if (!deleted) throw new ApiError(404, 'Widget not found');
}

// --- Public ---

export async function getPublicConfig(id) {
  const row = await widgetsRepo.findByIdPublic(id);
  if (!row) throw new ApiError(404, 'Widget not found');
  return toPublicConfig(row);
}

// Used internally by the submissions service to confirm a widget
// exists before accepting a submission for it.
export async function assertWidgetExists(id) {
  const row = await widgetsRepo.findByIdPublic(id);
  if (!row) throw new ApiError(404, 'Widget not found');
  return row;
}
