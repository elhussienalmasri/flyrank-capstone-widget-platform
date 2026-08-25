// Signup-only setting: require email verification BEFORE the
// visitor's account is created at all. Off by default — the owner
// opts in with a single checkbox. Stored in
// widget.displayOptions.emailVerificationEnabled.
export default function SignupSettings({ displayOptions, onChange }) {
  const checked = displayOptions.emailVerificationEnabled === true || displayOptions.emailVerificationEnabled === 'true';

  function handleToggle(e) {
    onChange({ target: { name: 'emailVerificationEnabled', value: e.target.checked } });
  }

  return (
    <div className="border-t border-gray-100 pt-5">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Email verification</h3>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleToggle}
          className="mt-0.5"
        />
        <span>
          Require visitors to verify their email before their account is created.
          <span className="block text-xs text-gray-500 mt-0.5">
            Off by default. When enabled, signing up doesn't create the account right away —
            a verification link is emailed first, and the account is only created once it's
            clicked. Visitors can also request a password reset by email.
          </span>
        </span>
      </label>
    </div>
  );
}
