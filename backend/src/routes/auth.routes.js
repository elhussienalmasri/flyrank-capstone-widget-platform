import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../schemas/auth.schema.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', validateBody(registerSchema), asyncHandler(authController.register));
router.post('/login', authRateLimiter, validateBody(loginSchema), asyncHandler(authController.login));
router.get('/me', requireAuth, asyncHandler(authController.me));

// Email verification + password reset — gated by EMAIL_FEATURES_ENABLED
// inside auth.service.js (returns a 403 there when disabled).
router.post('/verify-email', validateBody(verifyEmailSchema), asyncHandler(authController.verifyEmail));
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), asyncHandler(authController.forgotPassword));
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), asyncHandler(authController.resetPassword));

// Change password while logged in — works regardless of the email-features toggle.
router.post('/change-password', requireAuth, validateBody(changePasswordSchema), asyncHandler(authController.changePassword));

export default router;
