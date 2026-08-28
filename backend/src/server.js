import env from './config/env.js';
import app from './app.js';
import { ensureAdminAccount } from './services/auth.service.js';

async function start() {
  await ensureAdminAccount(); // seeds/promotes the platform admin from ADMIN_EMAIL/ADMIN_PASSWORD

  app.listen(env.port, () => {
    console.log(`Widget platform API listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
