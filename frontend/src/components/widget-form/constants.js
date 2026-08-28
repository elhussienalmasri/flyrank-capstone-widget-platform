// Shared constants for the widget form and its sections. Kept in one
// place so every section file (FieldEditor, PopoverTriggerSettings,
// ThankYouSettings, WidgetTypeSelect) and the orchestrator
// (WidgetForm.jsx) agree on the same widget-type list and defaults.

export const WIDGET_TYPES = [
  { value: 'subscribe', label: 'Subscribe (email, optional name)' },
  { value: 'signup', label: 'Sign up (name, email, password)' },
  { value: 'login', label: 'Log in (email, password)' },
  { value: 'cta', label: 'Call to action (custom fields)' },
  { value: 'popover', label: 'Popover (custom fields)' },
];

export const FIELD_TYPES = ['text', 'email', 'tel', 'textarea'];

// Types that carry real, owner-specific formFields data — used to
// decide whether formFields should be sent as-is vs forced to []
// (signup/login always get [] since the backend enforces their
// fixed shape). This is a data-preservation concern, separate from
// which UI component edits that data — see FREEFORM_FIELD_TYPES.
export const CUSTOM_FIELD_TYPES = new Set(['subscribe', 'cta', 'popover']);

// Of those, only cta/popover get the generic add/remove field
// editor. subscribe is locked down to a simple name/email toggle
// instead (see SubscribeSettings.jsx) — it is NOT freely configurable.
export const FREEFORM_FIELD_TYPES = new Set(['cta', 'popover']);

export const DEFAULT_DISPLAY_OPTIONS = {
  trigger: 'click',
  delaySeconds: 5,
  scrollPercent: 50,
  thankYouTitle: '',
  thankYouMessage: '',
  thankYouLinkUrl: '',
  thankYouLinkText: '',
  thankYouButtonColor: '#4f46e5',
  emailVerificationEnabled: false,
  accentColor: '#4f46e5', // cta only — the banner + submit button color
  linkedSignupWidgetId: '', // login only — which signup widget's accounts it authenticates against
};

export const DEFAULT_VALUES = {
  type: 'subscribe',
  title: '',
  description: '',
  buttonText: 'Submit',
  formFields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
  displayOptions: DEFAULT_DISPLAY_OPTIONS,
};

export function normalizeInitialValues(initialValues) {
  // Widgets loaded from the API may have displayOptions: {} — merge
  // in defaults so every controlled input always has a defined value.
  return {
    ...DEFAULT_VALUES,
    ...initialValues,
    displayOptions: { ...DEFAULT_DISPLAY_OPTIONS, ...(initialValues.displayOptions || {}) },
  };
}
