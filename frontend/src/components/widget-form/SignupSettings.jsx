// Signup-only setting: require email verification BEFORE the
// visitor's account is created at all. Off by default — the owner
// opts in with a single checkbox. Stored in
// widget.displayOptions.emailVerificationEnabled.
//
// This entire section disappears if the platform can't actually
// deliver email (MAILER=console, the dev default, or
// EMAIL_FEATURES_ENABLED=false) — offering a "verify by email"
// toggle that would never reach a real inbox is worse than not
// offering it at all. It reappears automatically once real email
// delivery (MAILER=smtp) is configured.
import { useEffect, useState } from 'react';
import { getConfig } from '../../api/configApi';

export default function SignupSettings({ displayOptions, onChange }) {
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getConfig()
      .then((config) => { if (!cancelled) setEmailEnabled(config.emailEnabled); })
      .catch(() => {}); // fail closed — stay hidden if the check itself fails
    return () => { cancelled = true; };
  }, []);

  if (!emailEnabled) return null;

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
            a verification code is emailed first, and the account is only created once it's
            entered. Visitors can also request a password reset by email.
          </span>
        </span>
      </label>
    </div>
  );
}
