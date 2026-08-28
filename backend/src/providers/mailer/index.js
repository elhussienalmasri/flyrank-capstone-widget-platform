// Single place that decides which mailer implementation is active,
// so notify.service.js (submission emails) and the auth email flows
// (verification / password reset) don't each duplicate this switch.
import env from '../../config/env.js';
import * as consoleMailer from './consoleMailer.js';
import * as smtpMailer from './smtpMailer.js';

export function getMailer() {
  // Tests exercise the email-only account flows, but must never attempt a
  // real SMTP connection. They declare MAILER=smtp so the feature flag is
  // enabled, then use this deterministic in-process mailer instead.
  if (env.nodeEnv === 'test') return consoleMailer;
  return env.mailer === 'smtp' ? smtpMailer : consoleMailer;
}
