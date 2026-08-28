// Escapes user-submitted values before they're interpolated into an
// HTML email. Submission field values are entirely owner-defined
// and visitor-supplied — never trust them unescaped in HTML, or a
// submission containing "<script>..." becomes a stored XSS payload
// the moment the owner opens the notification email.
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
