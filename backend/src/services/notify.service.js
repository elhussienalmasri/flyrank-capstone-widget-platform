// Safe side effect: fires a confirmation notification after a
// submission is stored. MUST NOT throw past this module — a failing
// mailer/webhook can never break the caller's success response.
import { getMailer } from '../providers/mailer/index.js';
import { submissionNotificationTemplate, formatFieldsPlainText } from './emailTemplates.service.js';

// Returns true/false (did it succeed) instead of throwing — callers
// use the result to record `notified` on the submission, but never
// to decide whether the submission itself succeeded.
export async function notifySubmission({ widgetTitle, fields, to }) {
  if (!to) {
    // No real tenant email to notify — treat as a non-fatal skip,
    // same as any other failed side effect.
    console.error('[notify] no recipient email available — skipping notification');
    return false;
  }

  try {
    const mailer = getMailer();
    await mailer.send({
      to,
      subject: `New submission: ${widgetTitle}`,
      body: `A visitor submitted the "${widgetTitle}" widget:\n\n${formatFieldsPlainText(fields)}`,
      html: submissionNotificationTemplate({ widgetTitle, fields }),
    });
    return true;
  } catch (err) {
    console.error('[notify] side effect failed (submission still succeeds):', err.message);
    return false;
  }
}
