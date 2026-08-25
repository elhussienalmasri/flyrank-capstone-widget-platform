// Platform-admin API. Uses the exact same JWT auth as every other
// owner route — the only difference is the added role check. There
// is no separate admin credential system; the admin is a tenant row
// with role='admin' (seeded at boot from ADMIN_EMAIL/ADMIN_PASSWORD,
// see ensureAdminAccount() in auth.service.js).
import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdminRole } from '../middleware/requireAdminRole.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();
router.use(requireAuth, requireAdminRole);

// GET /api/admin/accounts — every owner account + their widgets
router.get('/accounts', asyncHandler(adminController.listAccounts));

// DELETE /api/admin/accounts/:id — permanent, cascades widgets/
// submissions/visitor accounts for that tenant. The client is
// responsible for confirming with the admin before calling this.
router.delete('/accounts/:id', asyncHandler(adminController.deleteAccount));

export default router;
