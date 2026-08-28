// Loads and validates environment variables once, at boot.
// Fail fast: if something required is missing, crash immediately
// instead of failing weirdly later mid-request.
import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key} (check your .env against .env.example)`);
  }
}

export default {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Base URL used to build embed <script> snippets — must be
  // reachable by browsers on sites the owner embeds the widget on.
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4000}`,

  // Allowed origins for the PUBLIC submission/config endpoints.
  // '*' in dev; a comma-separated allowlist in production.
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()),

  // Abuse protection
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  rateLimitMaxPerWindow: Number(process.env.RATE_LIMIT_MAX_PER_WINDOW || 10),

  // Geo enrichment
  geoProviderTimeoutMs: Number(process.env.GEO_PROVIDER_TIMEOUT_MS || 2000),

  // Safe side effect
  mailer: process.env.MAILER || 'console', // 'console' | 'smtp'
  smtpHost: process.env.SMTP_HOST || 'localhost',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true', // true for port 465
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || 'widget-platform@example.com',

  // Email verification + password reset (owner accounts). Enabled
  // by default; set to 'false' to disable account email verification
  // and forgot-password entirely (change-password while logged in
  // still works either way, since it needs no email delivery).
  emailFeaturesEnabled: process.env.EMAIL_FEATURES_ENABLED !== 'false',

  // When true (default), a new owner account is NOT created at
  // registration time — the signup is staged, a verification email
  // is sent, and the real account only gets created once the link
  // is clicked. Set to 'false' to skip this and create the account
  // immediately (still sends a verification email if
  // emailFeaturesEnabled is on, but doesn't block login on it).
  // Has no effect if emailFeaturesEnabled is false — there'd be no
  // way to ever deliver the link, so registration always falls back
  // to immediate creation in that case.
  requireEmailVerificationForSignup: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',

  // Where verification/reset links in emails point — the FRONTEND,
  // not the API, since a person clicks these from their inbox.
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',

  // The platform admin is just a tenant row with role='admin' — set
  // once at boot from these two vars (see ensureAdminAccount() in
  // auth.service.js). Leave blank to skip creating an admin account
  // entirely. There is no separate admin credential system —
  // logging in as the admin uses the exact same /api/auth/login.
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
};
