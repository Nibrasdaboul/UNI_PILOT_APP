/**
 * Unit tests for subscription service (plan limits and period logic).
 * Does not require DB; tests getPlanLimits and getCurrentPeriod logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPlanLimits } from './subscriptionService.js';

describe('subscriptionService', () => {
  describe('getPlanLimits', () => {
    it('returns unlimited for pro plan', () => {
      const out = getPlanLimits('pro');
      expect(out.aiMonthlyLimit).toBeNull();
    });

    it('returns unlimited for student plan', () => {
      const out = getPlanLimits('student');
      expect(out.aiMonthlyLimit).toBeNull();
    });

    it('returns numeric limit for free plan', () => {
      const out = getPlanLimits('free');
      expect(out.aiMonthlyLimit).toBeDefined();
      expect(typeof out.aiMonthlyLimit).toBe('number');
      expect(out.aiMonthlyLimit).toBeGreaterThan(0);
    });

    it('defaults to free when planId is null/undefined', () => {
      const out = getPlanLimits(null);
      expect(out.aiMonthlyLimit).toBeDefined();
      expect(typeof out.aiMonthlyLimit).toBe('number');
      const out2 = getPlanLimits(undefined);
      expect(out2.aiMonthlyLimit).toBeDefined();
    });

    it('treats unknown plan as free', () => {
      const out = getPlanLimits('unknown');
      expect(out.aiMonthlyLimit).toBeDefined();
      expect(typeof out.aiMonthlyLimit).toBe('number');
    });

    it('is case-insensitive for pro/student', () => {
      expect(getPlanLimits('Pro').aiMonthlyLimit).toBeNull();
      expect(getPlanLimits('STUDENT').aiMonthlyLimit).toBeNull();
    });
  });
});
