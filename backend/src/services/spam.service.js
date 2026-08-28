// Spam controls for the public submission endpoint. Two independent
// checks, both silent (never tip off a bot as to why it failed):
//  1. Honeypot — a field real visitors never see or fill (styled
//     off-screen client-side in widget.v1.js). If it has a value,
//     the submitter is almost certainly a bot filling every field.
//  2. Basic heuristic — content that looks like HTML/script injection.
// NOTE: "did the visitor fill anything in at all" is NOT spam — it's
// a validation problem, and is handled separately (as a real 400,
// not a silent drop) in submissions.service.js, since a legitimate
// user submitting an empty form deserves an honest error message.
const HONEYPOT_FIELD = 'companyWebsite';

export function isSpam(fields) {
  if (fields[HONEYPOT_FIELD] && String(fields[HONEYPOT_FIELD]).trim().length > 0) {
    return true;
  }

  const values = Object.entries(fields)
    .filter(([key]) => key !== HONEYPOT_FIELD)
    .map(([, value]) => String(value).trim());

  const looksLikeInjection = values.some((v) => /<script|javascript:/i.test(v));
  if (looksLikeInjection) return true;

  return false;
}

export { HONEYPOT_FIELD };
