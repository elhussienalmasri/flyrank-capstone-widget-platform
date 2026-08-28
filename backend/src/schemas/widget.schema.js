import { z } from 'zod';

// subscribe — email-only lead capture (was "signup_form")
// signup    — real visitor account creation (name/email/password)
// login     — real visitor authentication (email/password)
// cta       — fully owner-configurable fields + caption
// popover   — same as cta, different on-page presentation
export const WIDGET_TYPES = ['subscribe', 'signup', 'login', 'cta', 'popover'];

const formFieldSchema = z.object({
  name: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'password']),
  required: z.boolean().optional().default(false),
});

export const createWidgetSchema = z.object({
  type: z.enum(WIDGET_TYPES, { errorMap: () => ({ message: `type must be one of: ${WIDGET_TYPES.join(', ')}` }) }),
  title: z.string().trim().min(2, 'title must be at least 2 characters').max(120),
  description: z.string().trim().max(500).optional().default(''),
  buttonText: z.string().trim().min(1).max(60).optional().default('Submit'),
  // No static default here — cta/popover owners define their own
  // fields (with their own required/optional choices per field);
  // subscribe/signup/login get a sensible default applied in the
  // service layer if the owner doesn't override it.
  formFields: z.array(formFieldSchema).max(20).optional(),
  displayOptions: z.record(z.any()).optional().default({}),
});

export const updateWidgetSchema = createWidgetSchema.partial();
