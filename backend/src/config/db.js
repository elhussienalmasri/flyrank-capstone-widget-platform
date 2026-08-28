// Single shared Postgres connection pool.
// Every repository imports { query } from here — nothing else in the
// app talks to `pg` directly.
import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

export const query = (text, params) => pool.query(text, params);
export { pool };
