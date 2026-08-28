// The widget-type dropdown, plus the basic title/description/button
// text fields every widget type shares. Split out so WidgetForm.jsx
// doesn't have to inline this markup itself.
import FormField, { inputClass } from '../FormField';
import { WIDGET_TYPES } from './constants';

export default function WidgetTypeSelect({ formValues, onTypeChange, onChange, fieldErrors }) {
  return (
    <div>
      <FormField label="Widget type">
        <select name="type" value={formValues.type} onChange={onTypeChange} className={inputClass}>
          {WIDGET_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Title" error={fieldErrors.title}>
        <input name="title" value={formValues.title} onChange={onChange} className={inputClass} />
      </FormField>

      <FormField label="Description" error={fieldErrors.description}>
        <textarea
          name="description"
          value={formValues.description}
          onChange={onChange}
          rows={3}
          className={inputClass}
        />
      </FormField>

      <FormField label="Button text" error={fieldErrors.buttonText}>
        <input name="buttonText" value={formValues.buttonText} onChange={onChange} className={inputClass} />
      </FormField>
    </div>
  );
}
