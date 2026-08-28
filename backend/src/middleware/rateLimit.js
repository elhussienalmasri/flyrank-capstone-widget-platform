// Per-IP rate limiting for public, cross-origin endpoints. A flood
// gets 429s; legitimate traffic right after keeps working —
// express-rate-limit tracks per-key windows, it doesn't take the
// whole service down.
import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

function makeLimiter({ windowMs, max, message, keyGenerator }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message } },
    keyGenerator: keyGenerator || ((req) => `${req.ip}:${req.params?.id || req.body?.widgetId || 'unknown'}`),
  });
}

export const submissionRateLimiter = makeLimiter({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxPerWindow,
  message: 'Too many submissions — please try again shortly.',
});

// Stricter than submissions — login is a classic brute-force target.
// Used for both owner (tenant) and visitor auth endpoints.
export const authRateLimiter = makeLimiter({
  windowMs: env.rateLimitWindowMs,
  max: Math.max(5, Math.floor(env.rateLimitMaxPerWindow / 2)),
  message: 'Too many attempts — please try again shortly.',
  // Owner auth endpoints have no widgetId — key by IP + whatever
  // email was submitted (or the route's widget id, for visitor auth).
  keyGenerator: (req) => `${req.ip}:${req.params?.id || req.body?.email || req.body?.widgetId || 'unknown'}`,
});

// Back-compat alias — visitor signup/login routes already import this name.
export const visitorAuthRateLimiter = authRateLimiter;
