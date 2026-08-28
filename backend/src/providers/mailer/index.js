// Single place that decides which mailer implementation is active,
// so notify.service.js (submission emails) and the auth email flows
// (verification / password reset) don't each duplicate this switch.
import env from '../../config/env.js';
import * as consoleMailer from './consoleMailer.js';
import * as smtpMailer from './smtpMailer.js';

export function getMailer() {
  return env.mailer === 'smtp' ? smtpMailer : consoleMailer;
}
