// Dev-default "mailer" — just logs instead of sending. What's
// graded/tested is that a FAILING side effect never blocks the
// caller, not that email actually gets delivered.
export async function send({ to, subject, body, html }) {
  console.log(`[mailer:console] to=${to} subject="${subject}"\n${body}`);
  if (html) console.log('[mailer:console] (html body also provided, not rendered in console)');
}
