import { z } from 'zod';

export const registerSchema = z.object({
  companyName: z.string().trim().min(2, 'companyName must be at least 2 characters').max(120),
  email: z.string().trim().email('must be a valid email').max(200),
  password: z.string().min(8, 'password must be at least 8 characters').max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email('must be a valid email'),
  password: z.string().min(1, 'password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('must be a valid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'token is required'),
  newPassword: z.string().min(8, 'newPassword must be at least 8 characters').max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'currentPassword is required'),
  newPassword: z.string().min(8, 'newPassword must be at least 8 characters').max(200),
});
