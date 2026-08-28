// Real email delivery via nodemailer, against any standard SMTP
// server — Gmail, SendGrid/Mailgun's SMTP endpoints, your company's
// mail server, or a local dev catcher like Mailpit (just point
// SMTP_HOST/SMTP_PORT at it). Configured entirely through env vars,
// so no code changes are needed to switch providers.
import nodemailer from 'nodemailer';
import env from '../../config/env.js';

let cachedTransport = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure, // true for port 465, false for 587/25 (STARTTLS)
    auth: env.smtpUser
      ? { user: env.smtpUser, pass: env.smtpPass }
      : undefined, // some local/dev SMTP servers (e.g. Mailpit) need no auth
  });

  return cachedTransport;
}

export async function send({ to, subject, body, html }) {
  const transport = getTransport();
  await transport.sendMail({
    from: env.mailFrom,
    to,
    subject,
    text: body,
    html: html || undefined,
  });
}
