import * as adminService from '../services/admin.service.js';

export async function listAccounts(req, res) {
  const accounts = await adminService.listAccounts();
  res.status(200).json({ accounts });
}

export async function deleteAccount(req, res) {
  await adminService.deleteAccount(req.params.id);
  res.status(204).send();
}
