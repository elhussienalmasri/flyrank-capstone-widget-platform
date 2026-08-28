// Public, cross-origin submission endpoint.
import express from 'express';
import cors from 'cors';
import asyncHandler from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { submissionRateLimiter } from '../middleware/rateLimit.js';
import { submissionSchema } from '../schemas/submission.schema.js';
import * as submissionsController from '../controllers/submissions.controller.js';

const router = express.Router();

router.use(cors()); // must handle preflight (OPTIONS) for any origin

router.post(
  '/',
  submissionRateLimiter,
  validateBody(submissionSchema),
  asyncHandler(submissionsController.create)
);

export default router;
