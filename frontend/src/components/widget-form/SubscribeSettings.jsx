// Subscribe is deliberately locked down, not freely configurable
// like cta/popover: email is always collected (and always required),
// and the owner can optionally also collect a name — with its own
// independent "required" choice. Nothing else — a subscribe widget
// is meant to stay a lightweight mailing-list signup; anything more
// belongs on a cta widget instead.
const EMAIL_FIELD = { name: 'email', label: 'Email', type: 'email', required: true };

export default function SubscribeSettings({ formFields, onSetFields }) {
  const nameField = formFields.find((f) => f.name === 'name');
  const includesName = Boolean(nameField);
  const nameRequired = Boolean(nameField && nameField.required);

  function handleToggleName(e) {
    if (e.target.checked) {
      onSetFields([{ name: 'name', label: 'Name', type: 'text', required: false }, EMAIL_FIELD]);
    } else {
      onSetFields([EMAIL_FIELD]);
    }
  }

  function handleToggleNameRequired(e) {
    onSetFields([{ name: 'name', label: 'Name', type: 'text', required: e.target.checked }, EMAIL_FIELD]);
  }

  return (
    <div className="border-t border-gray-100 pt-5">
      <h3 className="text-sm font-medium text-gray-900 mb-2">Fields</h3>
      <p className="text-xs text-gray-500 mb-3">
        Email is always collected and always required. You can also optionally collect a name.
      </p>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={includesName} onChange={handleToggleName} />
        Also collect name
      </label>

      {includesName && (
        <label className="flex items-center gap-2 text-sm text-gray-700 mt-2 ml-6">
          <input type="checkbox" checked={nameRequired} onChange={handleToggleNameRequired} />
          Require name
        </label>
      )}
    </div>
  );
}
