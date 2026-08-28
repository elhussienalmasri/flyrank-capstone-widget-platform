import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  const result = await authService.register(req.body);

  if (result.pending) {
    // 202 Accepted: the request was valid, but the account doesn't
    // exist yet — creation is pending the verification link.
    return res.status(202).json({
      pending: true,
      message: 'Check your email to verify your address and finish creating your account.',
    });
  }

  res.status(201).json({ tenant: result.tenant, token: result.token });
}

export async function login(req, res) {
  const { tenant, token } = await authService.login(req.body);
  res.status(200).json({ tenant, token });
}

export async function me(req, res) {
  const tenant = await authService.getById(req.tenantId);
  res.status(200).json({ tenant });
}

export async function verifyEmail(req, res) {
  const result = await authService.verifyEmail(req.body.token);
  res.status(200).json(result);
}

export async function forgotPassword(req, res) {
  const result = await authService.forgotPassword(req.body.email);
  res.status(200).json(result);
}

export async function resetPassword(req, res) {
  const result = await authService.resetPassword(req.body.token, req.body.newPassword);
  res.status(200).json(result);
}

export async function changePassword(req, res) {
  const result = await authService.changePassword(req.tenantId, req.body.currentPassword, req.body.newPassword);
  res.status(200).json(result);
}
