// Owner-only dashboard routes, mounted under /api/dashboard.
import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(requireAuth);

// GET /api/dashboard/overview — counts over time, per-widget, geo breakdown
router.get('/overview', asyncHandler(dashboardController.overview));

// GET /api/dashboard/submissions?widgetId=... — raw list, optionally filtered
router.get('/submissions', asyncHandler(dashboardController.submissions));

// GET /api/dashboard/visitors?widgetId=... — registered accounts from
// signup widgets, optionally filtered to one widget (never includes
// password_hash — see dashboard.service.js)
router.get('/visitors', asyncHandler(dashboardController.visitors));

// DELETE /api/dashboard/submissions/:id — owner-scoped, permanent
router.delete('/submissions/:id', asyncHandler(dashboardController.deleteSubmission));

// DELETE /api/dashboard/visitors/:id — owner-scoped, permanent
router.delete('/visitors/:id', asyncHandler(dashboardController.deleteVisitor));

export default router;
