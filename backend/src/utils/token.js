// Cryptographically random tokens for email verification / password
// reset links. Not JWTs on purpose — these need to be single-use
// and revocable by clearing a DB column, which a stateless JWT can't
// do without a separate blocklist.
import crypto from 'crypto';

export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

// A short, human-typeable code for widget (visitor) verification —
// entered directly in the widget on the customer's site, unlike the
// long hex token above which is only ever used inside a clickable
// link on the platform's own frontend. crypto.randomInt is
// cryptographically sound and avoids floating-point bias.
export function generateVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString(); // 6 digits, "000000".."999999" excluded at the low end
}
