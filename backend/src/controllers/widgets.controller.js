import * as widgetsService from '../services/widgets.service.js';

export async function create(req, res) {
  const widget = await widgetsService.create(req.tenantId, req.body);
  res.status(201).json({ widget });
}

export async function list(req, res) {
  const widgets = await widgetsService.listForTenant(req.tenantId);
  res.status(200).json({ widgets });
}

export async function getOne(req, res) {
  const widget = await widgetsService.getForTenant(req.tenantId, req.params.id);
  res.status(200).json({ widget });
}

export async function update(req, res) {
  const widget = await widgetsService.updateForTenant(req.tenantId, req.params.id, req.body);
  res.status(200).json({ widget });
}

export async function remove(req, res) {
  await widgetsService.deleteForTenant(req.tenantId, req.params.id);
  res.status(204).send();
}
