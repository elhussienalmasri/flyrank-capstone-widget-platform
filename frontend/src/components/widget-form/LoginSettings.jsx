// Login-only setting: which signup widget's accounts this login
// widget authenticates against. Identity is scoped per signup
// widget now, not tenant-wide, so a login widget needs to know
// which one it belongs to. The dropdown only appears when the
// owner has more than one signup widget — with zero or one, there's
// nothing meaningful to choose between.
export default function LoginSettings({ displayOptions, onChange, signupWidgets }) {
  if (signupWidgets.length === 0) {
    return (
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Linked signup widget</h3>
        <p className="text-xs text-amber-600">
          You don't have a signup widget yet — create one first, or this login widget
          won't have any accounts to authenticate against.
        </p>
      </div>
    );
  }

  if (signupWidgets.length === 1) {
    return (
      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Linked signup widget</h3>
        <p className="text-xs text-gray-500">
          This login widget authenticates against accounts from your signup widget,
          "{signupWidgets[0].title}".
        </p>
      </div>
    );
  }

  const linkedId = displayOptions.linkedSignupWidgetId || '';

  return (
    <div className="border-t border-gray-100 pt-5">
      <h3 className="text-sm font-medium text-gray-900 mb-2">Linked signup widget</h3>
      <p className="text-xs text-gray-500 mb-3">
        You have more than one signup widget — choose which one's accounts this login
        widget should authenticate against.
      </p>

      {!linkedId && (
        <p className="text-xs text-amber-600 mb-2">
          Not linked yet — until you choose one, this login widget defaults to your
          first-created signup widget, "{signupWidgets[0].title}".
        </p>
      )}

      <select
        name="linkedSignupWidgetId"
        value={linkedId}
        onChange={onChange}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="">Not linked (defaults to first-created)</option>
        {signupWidgets.map((w) => (
          <option key={w.id} value={w.id}>{w.title}</option>
        ))}
      </select>
    </div>
  );
}
