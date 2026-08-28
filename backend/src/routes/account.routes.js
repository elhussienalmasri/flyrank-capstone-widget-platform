import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import * as accountController from '../controllers/account.controller.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/account — the owner's profile + all their widgets in one call
router.get('/', asyncHandler(accountController.overview));

export default router;
