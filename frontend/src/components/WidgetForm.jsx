// Orchestrator for the widget create/edit form. Holds all form
// state and handlers; the actual per-section UI lives in its own
// file under widget-form/, so no single file has to carry every
// widget type's configuration at once:
//   widget-form/constants.js              shared types/defaults
//   widget-form/WidgetTypeSelect.jsx       type + title/description/button
//   widget-form/SubscribeSettings.jsx      subscribe-only: name/email toggle
//   widget-form/FieldEditor.jsx            freeform custom fields (cta/popover)
//   widget-form/CtaAppearance.jsx          cta-only: banner accent color
//   widget-form/PopoverTriggerSettings.jsx popover-only: click/delay/scroll
//   widget-form/ThankYouSettings.jsx       post-submit message + button
import { useState } from 'react';
import {
  CUSTOM_FIELD_TYPES,
  FREEFORM_FIELD_TYPES,
  DEFAULT_VALUES,
  normalizeInitialValues,
} from './widget-form/constants';
import WidgetTypeSelect from './widget-form/WidgetTypeSelect';
import SubscribeSettings from './widget-form/SubscribeSettings';
import FieldEditor from './widget-form/FieldEditor';
import PopoverTriggerSettings from './widget-form/PopoverTriggerSettings';
import ThankYouSettings from './widget-form/ThankYouSettings';
import SignupSettings from './widget-form/SignupSettings';
import CtaAppearance from './widget-form/CtaAppearance';
import LoginSettings from './widget-form/LoginSettings';

const SUBSCRIBE_DEFAULT_FIELDS = [{ name: 'email', label: 'Email', type: 'email', required: true }];

export default function WidgetForm({ initialValues = DEFAULT_VALUES, onSubmit, submitLabel = 'Save', signupWidgets = [] }) {
  const [formValues, setFormValues] = useState(() => normalizeInitialValues(initialValues));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Switching type must never carry over fields that don't make
  // sense for the new type:
  //  - signup/login: always [] — fixed, backend-enforced shape.
  //  - subscribe: always reset to the canonical email-only default —
  //    never inherit arbitrary fields left over from cta/popover,
  //    since subscribe only ever allows name/email.
  //  - cta/popover: keep whatever was already there, so switching
  //    between the two freeform types doesn't lose work.
  function handleTypeChange(e) {
    const newType = e.target.value;
    setFormValues((prev) => {
      let formFields;
      if (newType === 'subscribe') {
        formFields = SUBSCRIBE_DEFAULT_FIELDS;
      } else if (CUSTOM_FIELD_TYPES.has(newType)) {
        formFields = prev.formFields;
      } else {
        formFields = [];
      }
      return { ...prev, type: newType, formFields };
    });
  }

  function handleDisplayOptionChange(e) {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, displayOptions: { ...prev.displayOptions, [name]: value } }));
  }

  function setFormFieldsDirect(fields) {
    setFormValues((prev) => ({ ...prev, formFields: fields }));
  }

  function updateField(index, patch) {
    setFormValues((prev) => {
      const formFields = prev.formFields.map((f, i) => (i === index ? { ...f, ...patch } : f));
      return { ...prev, formFields };
    });
  }

  function addField() {
    setFormValues((prev) => ({
      ...prev,
      formFields: [...prev.formFields, { name: '', label: '', type: 'text', required: false }],
    }));
  }

  function removeField(index) {
    setFormValues((prev) => ({ ...prev, formFields: prev.formFields.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    // Belt-and-suspenders: never send a formFields override for
    // signup/login, regardless of how formValues got here.
    const payload = {
      ...formValues,
      formFields: CUSTOM_FIELD_TYPES.has(formValues.type) ? formValues.formFields : [],
    };

    // Check before ever hitting the network — the backend enforces
    // this too, but there's no reason to wait for a round trip to
    // tell the owner their widget has no fields to fill in.
    if (CUSTOM_FIELD_TYPES.has(payload.type) && payload.formFields.length === 0) {
      setFormError('This widget needs at least one field — add one before saving.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      if (err.details) {
        const mapped = {};
        err.details.forEach((d) => { mapped[d.field] = d.message; });
        setFieldErrors(mapped);
      } else {
        setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const showSubscribeSettings = formValues.type === 'subscribe';
  const showFieldEditor = FREEFORM_FIELD_TYPES.has(formValues.type);
  const showCtaAppearance = formValues.type === 'cta';
  const showPopoverSettings = formValues.type === 'popover';
  const showThankYouSettings = formValues.type === 'subscribe' || formValues.type === 'cta' || formValues.type === 'popover';
  const showSignupSettings = formValues.type === 'signup';
  const showLoginSettings = formValues.type === 'login';

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-lg bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
      {formError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {formError}
        </p>
      )}

      <WidgetTypeSelect
        formValues={formValues}
        onTypeChange={handleTypeChange}
        onChange={handleChange}
        fieldErrors={fieldErrors}
      />

      {showSubscribeSettings && (
        <SubscribeSettings
          formFields={formValues.formFields}
          onSetFields={setFormFieldsDirect}
        />
      )}

      {showFieldEditor && (
        <FieldEditor
          fields={formValues.formFields}
          onAdd={addField}
          onUpdate={updateField}
          onRemove={removeField}
        />
      )}

      {showCtaAppearance && (
        <CtaAppearance
          displayOptions={formValues.displayOptions}
          onChange={handleDisplayOptionChange}
        />
      )}

      {showPopoverSettings && (
        <PopoverTriggerSettings
          displayOptions={formValues.displayOptions}
          onChange={handleDisplayOptionChange}
        />
      )}

      {showThankYouSettings && (
        <ThankYouSettings
          displayOptions={formValues.displayOptions}
          onChange={handleDisplayOptionChange}
        />
      )}

      {showSignupSettings && (
        <SignupSettings
          displayOptions={formValues.displayOptions}
          onChange={handleDisplayOptionChange}
        />
      )}

      {showLoginSettings && (
        <LoginSettings
          displayOptions={formValues.displayOptions}
          onChange={handleDisplayOptionChange}
          signupWidgets={signupWidgets}
        />
      )}

      <button
        type="submit"
        disabled={submitting}
        className="bg-indigo-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
