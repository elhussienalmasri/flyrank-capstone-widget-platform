// The owner's combined account view: their profile + all their
// widgets in one response. Deleting the account (DELETE /api/auth/me)
// cascades to widgets, submissions, and visitor accounts via the
// ON DELETE CASCADE foreign keys already in place — this controller
// is read-only; delete lives in auth.controller.js since it's the
// same "account" resource.
import * as authService from '../services/auth.service.js';
import * as widgetsService from '../services/widgets.service.js';

export async function overview(req, res) {
  const [tenant, widgets] = await Promise.all([
    authService.getById(req.tenantId),
    widgetsService.listForTenant(req.tenantId),
  ]);
  res.status(200).json({ tenant, widgets });
}
