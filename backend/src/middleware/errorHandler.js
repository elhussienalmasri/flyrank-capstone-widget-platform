// Central error handler — the ONLY place that turns an error into
// an HTTP response. Never leaks stack traces or raw DB errors.
import ApiError from '../utils/ApiError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: 'Route not found' } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, details: err.details || undefined },
    });
  }

  // Postgres unique violation (e.g. duplicate email) — translate to 409
  if (err.code === '23505') {
    return res.status(409).json({ error: { message: 'That record already exists' } });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ error: { message: 'Internal server error' } });
}
