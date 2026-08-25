// Gates every /api/admin/* route. Always used AFTER requireAuth —
// this only checks the role on an already-verified token, it does
// not verify the token itself. A non-admin owner gets a clean 403,
// same as any other authorization failure in this app.
import ApiError from '../utils/ApiError.js';

export function requireAdminRole(req, res, next) {
  if (req.tenantRole !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
}
