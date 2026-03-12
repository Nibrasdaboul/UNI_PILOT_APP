import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from './validate.js';

describe('auth validation schemas', () => {
  describe('registerSchema', () => {
    it('accepts valid email, password, optional full_name', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        full_name: 'Test User',
      });
      expect(result.success).toBe(true);
    });
    it('accepts without full_name', () => {
      const result = registerSchema.safeParse({
        email: 'a@b.co',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });
    it('rejects short password', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });
    it('rejects invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
    it('rejects empty email', () => {
      const result = registerSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'any',
      });
      expect(result.success).toBe(true);
    });
    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
    it('rejects invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'bad',
        password: 'secret',
      });
      expect(result.success).toBe(false);
    });
  });
});
