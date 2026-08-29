// Creates a ready-to-explore local database. It is safe to run more than once:
// the demo owner/widgets are reused and each widget receives at most three
// marked sample submissions.
import bcrypt from 'bcrypt';
import { query, pool } from './db.js';

const DEMO_OWNER = {
  companyName: 'Demo Widgets Co',
  email: 'demo@widget-platform.local',
  password: 'DemoPassword123!',
};

const SEED_IP = '203.0.113.10';
const SEED_PROVIDER = 'seed';

const LOCATIONS = [
  { country: 'United States', city: 'New York' },
  { country: 'United Kingdom', city: 'London' },
  { country: 'Canada', city: 'Toronto' },
  { country: 'France', city: 'Paris' },
  { country: 'Egypt', city: 'Cairo' },
  { country: 'Japan', city: 'Tokyo' },
];

const WIDGET_DEFINITIONS = [
  {
    key: 'demo-signup', type: 'signup', title: 'Demo account signup',
    description: 'Create an account to access the demo.', buttonText: 'Create account',
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
      { name: 'confirmPassword', label: 'Confirm password', type: 'password', required: true },
    ],
    displayOptions: { emailVerificationEnabled: false },
  },
  {
    key: 'demo-subscribe', type: 'subscribe', title: 'Demo newsletter',
    description: 'Get product updates and practical tips.', buttonText: 'Subscribe',
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: false },
      { name: 'email', label: 'Email', type: 'email', required: true },
    ],
    displayOptions: {},
  },
  {
    key: 'demo-cta', type: 'cta', title: 'Demo consultation',
    description: 'Tell us how we can help.', buttonText: 'Request consultation',
    formFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Work email', type: 'email', required: true },
      { name: 'message', label: 'What do you need?', type: 'textarea', required: true },
    ],
    displayOptions: { thankYouTitle: 'Thanks for reaching out!', thankYouMessage: 'We will contact you shortly.' },
  },
  {
    key: 'demo-popover', type: 'popover', title: 'Demo special offer',
    description: 'Claim a tailored offer for your team.', buttonText: 'Get my offer',
    formFields: [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'company', label: 'Company', type: 'text', required: false },
    ],
    displayOptions: { trigger: 'delay', delay: 5, thankYouTitle: 'Your offer is on its way!' },
  },
  {
    key: 'demo-login', type: 'login', title: 'Demo account login',
    description: 'Sign in with an account created through the signup widget.', buttonText: 'Sign in',
    formFields: [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
    displayOptions: {},
  },
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'widget';
}

function sampleValue(field, widget, number) {
  const label = field.label || field.name;
  const widgetSlug = slug(widget.title);
  if (field.type === 'email' || field.name.toLowerCase().includes('email')) return `${widgetSlug}-${number}@example.com`;
  if (field.type === 'password') return 'SamplePassword123!';
  if (field.type === 'tel') return `+1 555 010${number}`;
  if (field.type === 'textarea') return `Sample ${label.toLowerCase()} from visitor ${number} for ${widget.title}.`;
  if (field.name.toLowerCase().includes('company')) return `Example Company ${number}`;
  if (field.name.toLowerCase().includes('name')) return `${widget.title} visitor ${number}`;
  return `Sample ${label} ${number}`;
}

function buildFields(formFields, widget, number) {
  return (Array.isArray(formFields) ? formFields : []).reduce((fields, field) => {
    fields[field.name] = sampleValue(field, widget, number);
    return fields;
  }, {});
}

async function ensureDemoOwner() {
  const passwordHash = await bcrypt.hash(DEMO_OWNER.password, 10);
  const { rows } = await query(
    `INSERT INTO tenants (company_name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE
       SET company_name = EXCLUDED.company_name,
           password_hash = EXCLUDED.password_hash,
           email_verified = true
     RETURNING id`,
    [DEMO_OWNER.companyName, DEMO_OWNER.email, passwordHash]
  );
  return rows[0].id;
}

async function ensureWidget(tenantId, definition, signupWidgetId) {
  const { rows: existing } = await query(
    `SELECT * FROM widgets
     WHERE tenant_id = $1 AND display_options->>'seedKey' = $2
     LIMIT 1`,
    [tenantId, definition.key]
  );

  const displayOptions = {
    ...definition.displayOptions,
    seedKey: definition.key,
    ...(definition.key === 'demo-login' && signupWidgetId ? { linkedSignupWidgetId: signupWidgetId } : {}),
  };

  if (existing[0]) return existing[0];

  const { rows } = await query(
    `INSERT INTO widgets (tenant_id, type, title, description, button_text, form_fields, display_options)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [tenantId, definition.type, definition.title, definition.description, definition.buttonText,
      JSON.stringify(definition.formFields), JSON.stringify(displayOptions)]
  );
  return rows[0];
}

async function ensureDemoWidgets(tenantId) {
  const signup = await ensureWidget(tenantId, WIDGET_DEFINITIONS[0]);
  const widgets = [signup];
  for (const definition of WIDGET_DEFINITIONS.slice(1)) {
    widgets.push(await ensureWidget(tenantId, definition, signup.id));
  }
  return widgets;
}

async function seedSubmissions(widgets) {
  let created = 0;
  for (const [widgetIndex, widget] of widgets.entries()) {
    const { rows } = await query(
      `SELECT count(*)::int AS count FROM submissions
       WHERE widget_id = $1 AND ip_address = $2 AND geo_provider = $3`,
      [widget.id, SEED_IP, SEED_PROVIDER]
    );
    const existing = rows[0].count;
    for (let index = existing; index < 3; index += 1) {
      const number = index + 1;
      const location = LOCATIONS[(widgetIndex * 3 + index) % LOCATIONS.length];
      await query(
        `INSERT INTO submissions (widget_id, tenant_id, fields, ip_address, geo_country, geo_city, geo_provider)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [widget.id, widget.tenant_id, JSON.stringify(buildFields(widget.form_fields, widget, number)),
          SEED_IP, location.country, location.city, SEED_PROVIDER]
      );
      created += 1;
    }
  }
  return created;
}

async function main() {
  try {
    const tenantId = await ensureDemoOwner();
    const demoWidgets = await ensureDemoWidgets(tenantId);
    const { rows: widgets } = await query(
      'SELECT id, tenant_id, title, form_fields FROM widgets ORDER BY created_at ASC'
    );
    const submissionsCreated = await seedSubmissions(widgets);
    console.log(`Demo owner: ${DEMO_OWNER.email} / ${DEMO_OWNER.password}`);
    console.log(`Created or reused ${demoWidgets.length} demo widget(s).`);
    console.log(`Seeded ${submissionsCreated} submission(s) across ${widgets.length} widget(s).`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
