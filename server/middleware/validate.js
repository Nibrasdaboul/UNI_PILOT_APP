import { z } from 'zod';

const emailSchema = z.string().email('Invalid email').max(255).trim();
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128);
const fullNameSchema = z.string().max(200).trim().optional();

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: fullNameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required'),
});

/**
 * Express middleware: validate req.body with a Zod schema and pass to next or 400.
 * @param {z.ZodSchema} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});
    if (result.success) {
      req.validated = result.data;
      next();
      return;
    }
    const first = result.error.errors[0];
    const message = first ? `${first.path.join('.')}: ${first.message}` : 'Validation failed';
    return res.status(400).json({ detail: message });
  };
}
