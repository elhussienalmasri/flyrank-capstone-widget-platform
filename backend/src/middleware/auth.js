// Verifies the Authorization: Bearer <token> header and attaches
// req.tenantId. Gates every OWNER route (widgets CRUD, dashboard) —
// never the public config/submission endpoints.
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.type === 'visitor' || !payload.tenantId) {
      throw new Error('Not an owner token');
    }
    req.tenantId = payload.tenantId;
    req.tenantEmail = payload.email;
    req.tenantRole = payload.role || 'owner';
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

// Visitor tokens are deliberately separate from owner tokens. They can only
// access visitor-facing endpoints for the widget that issued them.
export function requireVisitorAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.type !== 'visitor' || !payload.visitorId || !payload.widgetId || !payload.tenantId) {
      throw new Error('Not a visitor token');
    }

    req.visitorId = payload.visitorId;
    req.visitorTenantId = payload.tenantId;
    req.visitorWidgetId = payload.widgetId;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired visitor token'));
  }
}
