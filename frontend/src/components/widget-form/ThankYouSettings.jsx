// Post-submission settings: the message shown after a successful
// submit, and an optional button (rendered as a real button on the
// customer's site, not a plain text link — see widget.v1.js). The
// button's color is independently configurable from the CTA banner
// color, since a thank-you popup isn't always shown against the
// same background. Rendered for subscribe/cta/popover (the
// lead-capture types) — not signup/login, which show their own
// fixed success message instead.
import FormField, { inputClass } from '../FormField';

export default function ThankYouSettings({ displayOptions, onChange }) {
  return (
    <div className="border-t border-gray-100 pt-5">
      <h3 className="text-sm font-medium text-gray-900 mb-3">After submission</h3>

      <FormField label="Thank-you title">
        <input
          name="thankYouTitle"
          placeholder="Thanks!"
          value={displayOptions.thankYouTitle}
          onChange={onChange}
          className={inputClass}
        />
      </FormField>

      <FormField label="Thank-you message">
        <textarea
          name="thankYouMessage"
          placeholder="We'll be in touch soon."
          value={displayOptions.thankYouMessage}
          onChange={onChange}
          rows={2}
          className={inputClass}
        />
      </FormField>

      <FormField label="Button link (optional)">
        <input
          name="thankYouLinkUrl"
          placeholder="https://example.com/next-steps"
          value={displayOptions.thankYouLinkUrl}
          onChange={onChange}
          className={inputClass}
        />
      </FormField>

      {displayOptions.thankYouLinkUrl && (
        <>
          <FormField label="Button text">
            <input
              name="thankYouLinkText"
              placeholder="Learn more"
              value={displayOptions.thankYouLinkText}
              onChange={onChange}
              className={inputClass}
            />
          </FormField>

          <label className="flex items-center gap-3 text-sm text-gray-700 mb-4">
            Button color
            <input
              type="color"
              name="thankYouButtonColor"
              value={displayOptions.thankYouButtonColor}
              onChange={onChange}
              className="h-8 w-14 rounded border border-gray-300 cursor-pointer"
            />
          </label>
        </>
      )}
    </div>
  );
}
