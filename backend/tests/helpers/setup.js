// Imported by the HTTP request helper in every database-backed test file.
// Keep tests self-contained: never send real email, and release the database
// socket once that test file has completed.
import { after } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.MAILER = 'smtp';
process.env.SMTP_USER = 'test-user';
process.env.SMTP_PASS = 'test-password';

const { pool } = await import('../../src/config/db.js');

after(async () => {
  await pool.end();
});
