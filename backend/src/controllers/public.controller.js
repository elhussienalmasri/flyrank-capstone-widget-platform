// Public, cross-origin routes: config delivery + the widget.js
// loader. No auth here — any visitor's browser calls these.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as widgetsService from '../services/widgets.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const widgetBundlePath = path.join(__dirname, '..', '..', 'public-widget', 'widget.v1.js');
const widgetBundle = fs.readFileSync(widgetBundlePath, 'utf8');

// GET /widgets/:id/config
// Short-lived cache: config can change (owner edits title/fields),
// so we don't want browsers holding onto a stale version for long.
export async function getConfig(req, res) {
  const config = await widgetsService.getPublicConfig(req.params.id);
  res.set('Cache-Control', 'public, max-age=60'); // 1 minute
  res.status(200).json(config);
}

// GET /widget.js
// Versioned bundle: content only changes on a new release (a new
// URL/version), so it's safe to cache aggressively and forever.
export function getWidgetBundle(req, res) {
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(widgetBundle);
}
