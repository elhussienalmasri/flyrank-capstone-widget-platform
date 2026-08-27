// Public, read-only feature flags the frontend needs to know about
// before deciding what to show — currently just whether email is
// actually configured to deliver (MAILER=smtp) vs. only logging to
// the console (MAILER=console, the dev default). Nothing sensitive
// here — no secrets, no per-tenant data — safe to leave unauthenticated.
import express from 'express';
import env from '../config/env.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    // "Real" email delivery — not just the master on/off switch,
    // but whether a mailer that can actually reach an inbox is
    // configured. A visitor-facing feature (like widget signup
    // verification) that depends on email being delivered should
    // check THIS, not emailFeaturesEnabled alone.
    emailEnabled: env.emailFeaturesEnabled && env.mailer === 'smtp',
  });
});

export default router;
