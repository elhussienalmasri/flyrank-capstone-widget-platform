// The custom-field editor — add/remove/edit fields with a name,
// label, type, and required flag. Used only by widget types the
// owner configures themselves (subscribe/cta/popover); signup/login
// have a fixed field shape enforced by the backend and never render
// this component (see CUSTOM_FIELD_TYPES in constants.js).
import { FIELD_TYPES } from './constants';

export default function FieldEditor({ fields, onAdd, onUpdate, onRemove }) {
  return (
    <div className="border-t border-gray-100 pt-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Form fields</h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          + Add field
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Choose which fields to collect and which are required. At least one field must be
        filled by the visitor even if none are marked required.
      </p>

      {fields.length === 0 && (
        <p className="text-xs text-gray-400 italic mb-2">No fields yet — add at least one.</p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-md p-2"
          >
            <input
              placeholder="name (e.g. email)"
              value={field.name}
              onChange={(e) => onUpdate(index, { name: e.target.value })}
              className="w-28 rounded border border-gray-300 px-2 py-1 text-xs"
            />
            <input
              placeholder="Label shown to visitor"
              value={field.label}
              onChange={(e) => onUpdate(index, { label: e.target.value })}
              className="flex-1 min-w-[120px] rounded border border-gray-300 px-2 py-1 text-xs"
            />
            <select
              value={field.type}
              onChange={(e) => onUpdate(index, { type: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label
              title="Required"
              className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap shrink-0"
            >
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => onUpdate(index, { required: e.target.checked })}
              />
              <span className="text-red-500 font-medium">*</span>
            </label>
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label="Remove field"
              title="Remove field"
              className="text-gray-400 hover:text-red-600 shrink-0 p-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
