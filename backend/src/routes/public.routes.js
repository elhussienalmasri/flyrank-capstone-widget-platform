// Public routes — the customer's website (any origin) calls these.
// No requireAuth here by design: this is the "front door" traffic.
import express from 'express';
import cors from 'cors';
import asyncHandler from '../utils/asyncHandler.js';
import * as publicController from '../controllers/public.controller.js';

const router = express.Router();

// Open CORS for these two — they're meant to be fetched from any
// origin, that's the entire point of an embeddable widget.
router.use(cors());

// GET /widget.js?id=abc123  — the loader/bundle the <script> tag points to
router.get('/widget.js', publicController.getWidgetBundle);

// GET /widgets/:id/config  — widget settings the bundle renders
router.get('/widgets/:id/config', asyncHandler(publicController.getConfig));

export default router;
