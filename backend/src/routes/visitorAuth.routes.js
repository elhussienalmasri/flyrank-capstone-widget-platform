// Public, cross-origin visitor auth — real account creation/login
// for `signup`/`login` widgets, plus email verification and
// password reset (gated per-widget, see visitorAuth.service.js).
import express from 'express';
import cors from 'cors';
import asyncHandler from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { requireVisitorAuth } from '../middleware/auth.js';
import { visitorAuthRateLimiter } from '../middleware/rateLimit.js';
import {
  visitorSignupSchema,
  visitorLoginSchema,
  visitorVerifyEmailSchema,
  visitorForgotPasswordSchema,
  visitorResetPasswordSchema,
} from '../schemas/visitorAuth.schema.js';
import * as visitorAuthController from '../controllers/visitorAuth.controller.js';

const router = express.Router();

router.use(cors());

router.post(
  '/widgets/:id/signup',
  visitorAuthRateLimiter,
  validateBody(visitorSignupSchema),
  asyncHandler(visitorAuthController.signup)
);

router.post(
  '/widgets/:id/login',
  visitorAuthRateLimiter,
  validateBody(visitorLoginSchema),
  asyncHandler(visitorAuthController.login)
);

router.get(
  '/widgets/:id/me',
  requireVisitorAuth,
  asyncHandler(visitorAuthController.me)
);

router.post(
  '/widgets/:id/verify-email',
  validateBody(visitorVerifyEmailSchema),
  asyncHandler(visitorAuthController.verifyEmail)
);

router.post(
  '/widgets/:id/forgot-password',
  visitorAuthRateLimiter,
  validateBody(visitorForgotPasswordSchema),
  asyncHandler(visitorAuthController.forgotPassword)
);

router.post(
  '/widgets/:id/reset-password',
  visitorAuthRateLimiter,
  validateBody(visitorResetPasswordSchema),
  asyncHandler(visitorAuthController.resetPassword)
);

export default router;
