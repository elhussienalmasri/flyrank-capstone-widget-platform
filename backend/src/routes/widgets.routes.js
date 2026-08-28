import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { createWidgetSchema, updateWidgetSchema } from '../schemas/widget.schema.js';
import * as widgetsController from '../controllers/widgets.controller.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', validateBody(createWidgetSchema), asyncHandler(widgetsController.create));
router.get('/', asyncHandler(widgetsController.list));
router.get('/:id', asyncHandler(widgetsController.getOne));
router.patch('/:id', validateBody(updateWidgetSchema), asyncHandler(widgetsController.update));
router.delete('/:id', asyncHandler(widgetsController.remove));

export default router;
