import * as dashboardService from '../services/dashboard.service.js';

export async function overview(req, res) {
  const data = await dashboardService.getOverview(req.tenantId);
  res.status(200).json(data);
}

export async function submissions(req, res) {
  const { widgetId } = req.query;
  const data = await dashboardService.listSubmissions(req.tenantId, { widgetId });
  res.status(200).json({ submissions: data });
}

export async function visitors(req, res) {
  const { widgetId } = req.query;
  const data = await dashboardService.listVisitors(req.tenantId, { widgetId });
  res.status(200).json({ visitors: data });
}

export async function deleteSubmission(req, res) {
  await dashboardService.deleteSubmission(req.tenantId, req.params.id);
  res.status(204).send();
}

export async function deleteVisitor(req, res) {
  await dashboardService.deleteVisitor(req.tenantId, req.params.id);
  res.status(204).send();
}
