// Assembles the Express app: global middleware + route mounting.
// Four separate request paths, kept visually grouped:
//   1. Owner (authenticated): /api/auth, /api/widgets, /api/dashboard
//   2. Customer site (public, cached): /widget.js, /widgets/:id/config
//   3. Visitor (public, cross-origin, protected): /submissions
//   4. Platform admin (separate trust boundary): /api/admin
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import widgetsRoutes from './routes/widgets.routes.js';
import accountRoutes from './routes/account.routes.js';
import publicRoutes from './routes/public.routes.js';
import visitorAuthRoutes from './routes/visitorAuth.routes.js';
import submissionsRoutes from './routes/submissions.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Required for req.ip to reflect the real client IP when running
// behind a reverse proxy/load balancer in production.
app.set('trust proxy', 1);

app.use(express.json({ limit: '100kb' })); // reject absurdly large bodies early
app.use(cors()); // default CORS for admin/auth routes in dev

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 1. Owner (authenticated)
app.use('/api/auth', authRoutes);
app.use('/api/widgets', widgetsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/account', accountRoutes);

// 2. Customer site (public, cached) — mounted at root: GET /widget.js, GET /widgets/:id/config
app.use('/', publicRoutes);

// 2b. Visitor accounts (public, cross-origin) — POST /widgets/:id/signup, /widgets/:id/login
app.use('/', visitorAuthRoutes);

// 3. Visitor (public, cross-origin, protected)
app.use('/submissions', submissionsRoutes);

// 4. Platform admin — same JWT auth as everyone else, gated by role (see middleware/requireAdminRole.js)
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler); // must be registered last

export default app;
