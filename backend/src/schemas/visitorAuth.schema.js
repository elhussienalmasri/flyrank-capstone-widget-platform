// Boundary validation for the two visitor-facing auth endpoints.
// Deliberately separate from the generic `formFields` on a widget —
// those drive what widget.js renders, but password handling needs
// real, fixed validation regardless of how the owner configured
// their widget's cosmetic fields.
import { z } from 'zod';

export const visitorSignupSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(120),
    email: z.string().trim().email('must be a valid email').max(200),
    password: z.string().min(8, 'password must be at least 8 characters').max(200),
    confirmPassword: z.string().min(1, 'confirmPassword is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const visitorLoginSchema = z.object({
  email: z.string().trim().email('must be a valid email'),
  password: z.string().min(1, 'password is required'),
});

export const visitorVerifyEmailSchema = z.object({
  email: z.string().trim().email('must be a valid email'),
  code: z.string().trim().regex(/^\d{6}$/, 'code must be 6 digits'),
});

export const visitorForgotPasswordSchema = z.object({
  email: z.string().trim().email('must be a valid email'),
});

export const visitorResetPasswordSchema = z.object({
  token: z.string().min(1, 'token is required'),
  newPassword: z.string().min(8, 'newPassword must be at least 8 characters').max(200),
});
