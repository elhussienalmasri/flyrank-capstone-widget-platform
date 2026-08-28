// Styled HTML shells for every email the platform sends. Kept in
// one place so verification, reset, and submission-notification
// emails share the same look instead of each hand-rolling markup.
import { escapeHtml } from '../utils/escapeHtml.js';

function baseTemplate({ heading, bodyHtml }) {
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#ffffff;">
    <div style="border-bottom:2px solid #4f46e5;padding-bottom:12px;margin-bottom:20px;">
      <span style="font-size:14px;font-weight:600;color:#4f46e5;letter-spacing:0.02em;">WIDGET PLATFORM</span>
    </div>
    <h2 style="font-size:18px;color:#111827;margin:0 0 12px;">${escapeHtml(heading)}</h2>
    <div style="font-size:14px;color:#374151;line-height:1.6;">
      ${bodyHtml}
    </div>
    <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:12px;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        This is an automated message from Widget Platform.
      </p>
    </div>
  </div>`;
}

function button(url, label) {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;margin-top:12px;padding:10px 18px;
    background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
    ${escapeHtml(label)}
  </a>`;
}

// Used for widget (visitor) verification — a short code entered
// directly in the widget on the customer's own site, rather than a
// link that would send the visitor to the platform's own frontend
// (a page they never otherwise visit). See migration 013.
export function verifyCodeTemplate({ code }) {
  return baseTemplate({
    heading: 'Verify your email address',
    bodyHtml: `
      <p>Enter this code where you signed up to finish creating your account:</p>
      <p style="margin:16px 0;font-size:28px;font-weight:700;letter-spacing:6px;color:#111827;">${escapeHtml(code)}</p>
      <p style="margin-top:16px;font-size:12px;color:#9ca3af;">
        If you didn't request this, you can safely ignore this email. This code expires in 24 hours.
      </p>`,
  });
}

export function verifyEmailTemplate({ url }) {
  return baseTemplate({
    heading: 'Verify your email address',
    bodyHtml: `
      <p>Click the button below to confirm this is your email address.</p>
      ${button(url, 'Verify email')}
      <p style="margin-top:16px;font-size:12px;color:#9ca3af;">
        If you didn't request this, you can safely ignore this email. This link expires in 24 hours.
      </p>`,
  });
}

export function resetPasswordTemplate({ url }) {
  return baseTemplate({
    heading: 'Reset your password',
    bodyHtml: `
      <p>We received a request to reset your password. Click below to choose a new one.</p>
      ${button(url, 'Reset password')}
      <p style="margin-top:16px;font-size:12px;color:#9ca3af;">
        If you didn't request this, you can safely ignore this email. This link expires in 1 hour.
      </p>`,
  });
}

// Submission fields are entirely owner-defined and visitor-supplied,
// but always a flat string-to-string map (see submissions.schema.js)
// — safe to lay out as a simple label/value list generically,
// without assuming any specific field names. The honeypot field is
// already stripped out before this is ever called (see
// submissions.service.js) — it's an internal bot trap, never part
// of the widget's real fields, and never shown to the owner.
function formatFieldLabel(key) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

// Used for the plain-text email fallback (what shows up if the mail
// client doesn't render HTML, or in the console dev mailer).
export function formatFieldsPlainText(fields) {
  return Object.entries(fields)
    .map(([key, value]) => `${formatFieldLabel(key)}: ${value}`)
    .join('\n');
}

export function submissionNotificationTemplate({ widgetTitle, fields }) {
  const rows = Object.entries(fields)
    .map(([key, value]) => `
      <tr>
        <td style="padding:6px 12px 6px 0;font-size:12px;color:#6b7280;white-space:nowrap;vertical-align:top;">${escapeHtml(formatFieldLabel(key))}</td>
        <td style="padding:6px 0;font-size:13px;color:#111827;">${escapeHtml(value)}</td>
      </tr>`)
    .join('');

  return baseTemplate({
    heading: `New submission: ${widgetTitle}`,
    bodyHtml: `
      <p>A visitor just submitted the "${escapeHtml(widgetTitle)}" widget:</p>
      <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:4px 12px;">
        ${rows}
      </table>`,
  });
}
