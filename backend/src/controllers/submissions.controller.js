import * as submissionsService from '../services/submissions.service.js';

// POST /submissions — public, cross-origin, the most-attacked
// surface in the app. req.ip requires `app.set('trust proxy', ...)`
// upstream if deployed behind a real proxy/CDN.
export async function create(req, res) {
  const { widgetId, fields } = req.body;
  const result = await submissionsService.submit({ widgetId, fields, ipAddress: req.ip });

  // Same 2xx shape whether accepted or silently dropped as spam —
  // never give a bot a signal to distinguish the two.
  res.status(201).json({ status: 'received' });
}
