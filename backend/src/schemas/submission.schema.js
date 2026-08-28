// Boundary validation for the PUBLIC submission endpoint — this is
// the most-attacked surface in the app, so keep it strict: no
// unbounded strings, no arbitrary nested objects, no extra bloat.
import { z } from 'zod';

export const submissionSchema = z.object({
  widgetId: z.string().uuid('widgetId must be a valid id'),
  // Field values are always strings from a form; cap both key count
  // and value length so a malicious payload can't blow up storage.
  fields: z
    .record(z.string().max(2000))
    .refine((obj) => Object.keys(obj).length <= 30, {
      message: 'too many fields submitted',
    }),
});
