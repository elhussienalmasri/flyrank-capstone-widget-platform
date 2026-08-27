// Shared test helper: spins up the app on an ephemeral port for one
// request, then tears it down. Keeps every test file dependency-free
// beyond node:test itself.
import http from 'node:http';
import app from '../../src/app.js';
import * as pendingRegistrationsRepo from '../../src/repositories/pendingRegistrations.repository.js';

export function request(method, path, body, token, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const { port } = server.address();
      const data = body ? JSON.stringify(body) : null;
      const req = http.request(
        {
          method, port, path,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...extraHeaders,
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (chunk) => (raw += chunk));
          res.on('end', () => {
            server.close();
            // Not every endpoint returns JSON — GET /widget.js
            // returns the raw JS bundle, for one. Fall back to the
            // raw text instead of throwing, so tests that only care
            // about status/headers on non-JSON routes don't crash.
            let parsedBody = null;
            if (raw) {
              try {
                parsedBody = JSON.parse(raw);
              } catch {
                parsedBody = raw;
              }
            }
            resolve({ status: res.statusCode, body: parsedBody });
          });
        }
      );
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  });
}

// Used by every other test file to get a working owner token
// quickly, without caring how registration is currently configured.
// Handles both modes transparently:
//   - immediate creation (REQUIRE_EMAIL_VERIFICATION=false): the
//     register response already has a token, done.
//   - deferred creation (the default): register() only stages the
//     signup — look up the pending token directly (a real user gets
//     this from their inbox) and complete verification to obtain
//     a real token.
export async function registerTenant(label) {
  const email = `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const res = await request('POST', '/api/auth/register', {
    companyName: `${label} Co`, email, password: 'password123',
  });

  if (res.body?.token) return res.body.token;

  const pending = await pendingRegistrationsRepo.findByEmail(email);
  if (!pending) throw new Error(`registerTenant(${label}): registration neither returned a token nor created a pending record`);

  const verifyRes = await request('POST', '/api/auth/verify-email', { token: pending.verification_token });
  return verifyRes.body.token;
}
