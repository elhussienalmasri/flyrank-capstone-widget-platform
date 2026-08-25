import * as visitorAuthService from '../services/visitorAuth.service.js';

export async function signup(req, res) {
  const result = await visitorAuthService.signup(req.params.id, req.body);

  if (result.pending) {
    return res.status(202).json({
      pending: true,
      message: 'Check your email to verify your address and finish creating your account.',
    });
  }

  res.status(201).json({ visitor: result.visitor, token: result.token });
}

export async function login(req, res) {
  const { visitor, token } = await visitorAuthService.login(req.params.id, req.body);
  res.status(200).json({ visitor, token });
}

export async function verifyEmail(req, res) {
  const result = await visitorAuthService.verifyEmail(req.params.id, req.body);
  res.status(200).json(result);
}

export async function forgotPassword(req, res) {
  const result = await visitorAuthService.forgotPassword(req.params.id, req.body.email);
  res.status(200).json(result);
}

export async function resetPassword(req, res) {
  const result = await visitorAuthService.resetPassword(req.params.id, req.body.token, req.body.newPassword);
  res.status(200).json(result);
}
