// Turns a Zod schema into Express middleware. On failure, returns a
// clean 400 with field-level messages instead of a stack trace.
import ApiError from '../utils/ApiError.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, 'Validation failed', details));
    }

    req.body = result.data;
    next();
  };
}
