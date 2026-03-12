import { describe, it, expect } from 'vitest';
import {
  markToLetter,
  markToGpaPoints,
  getGradeStatus,
  computeFinalMarkFromItems,
  computeSemesterGpa,
  computeCGPA,
  computeCumPercent,
} from './gradeUtils.js';

describe('gradeUtils', () => {
  describe('markToLetter', () => {
    it('returns letter for numeric mark', () => {
      expect(markToLetter(95)).toBe('A');
      expect(markToLetter(90)).toBe('A-');
      expect(markToLetter(85)).toBe('B+');
      expect(markToLetter(80)).toBe('B');
      expect(markToLetter(50)).toBe('D');
      expect(markToLetter(45)).toBe('F');
    });
    it('returns null for null/undefined', () => {
      expect(markToLetter(null)).toBeNull();
      expect(markToLetter(undefined)).toBeNull();
    });
    it('clamps to 0-100', () => {
      expect(markToLetter(105)).toBe('A');
      expect(markToLetter(-1)).toBe('F');
    });
  });

  describe('markToGpaPoints', () => {
    it('returns GPA points for mark', () => {
      expect(markToGpaPoints(95)).toBe(3.75);
      expect(markToGpaPoints(80)).toBe(3.0);
      expect(markToGpaPoints(50)).toBe(1.5);
      expect(markToGpaPoints(40)).toBe(0);
    });
    it('returns null for null/undefined', () => {
      expect(markToGpaPoints(null)).toBeNull();
      expect(markToGpaPoints(undefined)).toBeNull();
    });
  });

  describe('getGradeStatus', () => {
    it('returns safe for >= 80', () => {
      expect(getGradeStatus(80)).toBe('safe');
      expect(getGradeStatus(100)).toBe('safe');
    });
    it('returns normal for 70-79', () => {
      expect(getGradeStatus(70)).toBe('normal');
      expect(getGradeStatus(79)).toBe('normal');
    });
    it('returns at_risk for 60-69', () => {
      expect(getGradeStatus(60)).toBe('at_risk');
      expect(getGradeStatus(69)).toBe('at_risk');
    });
    it('returns high_risk for < 60', () => {
      expect(getGradeStatus(59)).toBe('high_risk');
      expect(getGradeStatus(0)).toBe('high_risk');
    });
    it('returns normal for null', () => {
      expect(getGradeStatus(null)).toBe('normal');
    });
  });

  describe('computeFinalMarkFromItems', () => {
    it('returns weighted average', () => {
      const items = [
        { score: 80, max_score: 100, weight: 50 },
        { score: 90, max_score: 100, weight: 50 },
      ];
      expect(computeFinalMarkFromItems(items)).toBe(85);
    });
    it('returns null for empty items', () => {
      expect(computeFinalMarkFromItems([])).toBeNull();
      expect(computeFinalMarkFromItems(null)).toBeNull();
    });
    it('ignores items with zero weight', () => {
      const items = [
        { score: 70, max_score: 100, weight: 0 },
        { score: 90, max_score: 100, weight: 100 },
      ];
      expect(computeFinalMarkFromItems(items)).toBe(90);
    });
  });

  describe('computeSemesterGpa', () => {
    it('returns weighted GPA from courses with final_mark', () => {
      const courses = [
        { credit_hours: 3, final_mark: 90 },
        { credit_hours: 3, final_mark: 80 },
      ];
      expect(computeSemesterGpa(courses)).toBeGreaterThan(3);
      expect(computeSemesterGpa(courses)).toBeLessThanOrEqual(3.5);
    });
    it('returns 0 for empty or no graded credits', () => {
      expect(computeSemesterGpa([])).toBe(0);
      expect(computeSemesterGpa([{ credit_hours: 3, final_mark: null }])).toBe(0);
    });
  });

  describe('computeCGPA', () => {
    it('combines old CGPA with new semester', () => {
      const cgpa = computeCGPA(3.0, 30, 3.5, 15);
      expect(cgpa).toBeGreaterThan(3);
      expect(cgpa).toBeLessThan(3.5);
    });
    it('returns 0 when no credits', () => {
      expect(computeCGPA(0, 0, 0, 0)).toBe(0);
    });
  });

  describe('computeCumPercent', () => {
    it('combines old percent with new semester', () => {
      const p = computeCumPercent(75, 30, 80, 15);
      expect(p).toBeGreaterThan(75);
      expect(p).toBeLessThanOrEqual(80);
    });
    it('returns 0 when no credits', () => {
      expect(computeCumPercent(0, 0, 0, 0)).toBe(0);
    });
  });
});
