import { describe, it, expect } from 'vitest';
import {
  simplifyPolygon,
  previewSimplification,
  isPointInPolygon,
  pointToSegmentDistance,
} from '../../src/utils/geometryUtils';
import { Point } from '../../src/types';

describe('geometryUtils', () => {
  describe('simplifyPolygon', () => {
    it('should not modify triangles (3 points)', () => {
      const triangle: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ];

      const result = simplifyPolygon(triangle, 10);

      expect(result.simplifiedCount).toBe(3);
      expect(result.originalCount).toBe(3);
      expect(result.points).toHaveLength(3);
    });

    it('should reduce collinear points but maintain minimum 3 for polygon validity', () => {
      const line: Point[] = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 50, y: 0 },
        { x: 75, y: 0 },
        { x: 100, y: 0 },
      ];

      const result = simplifyPolygon(line, 1);

      expect(result.simplifiedCount).toBeGreaterThanOrEqual(3);
      expect(result.simplifiedCount).toBeLessThan(line.length);
      expect(result.points[0]).toEqual({ x: 0, y: 0 });
      expect(result.points[result.points.length - 1]).toEqual({ x: 100, y: 0 });
    });

    it('should preserve points beyond tolerance threshold', () => {
      const zigzag: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 },
        { x: 150, y: 50 },
        { x: 200, y: 0 },
      ];

      const result = simplifyPolygon(zigzag, 10);

      expect(result.simplifiedCount).toBeGreaterThanOrEqual(3);
      expect(result.simplifiedCount).toBeLessThanOrEqual(5);
    });

    it('should return original when tolerance is 0', () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 5 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
        { x: 0, y: 20 },
      ];

      const result = simplifyPolygon(polygon, 0);

      expect(result.simplifiedCount).toBe(polygon.length);
      expect(result.points).toHaveLength(polygon.length);
    });

    it('should return original when tolerance is negative', () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 0, y: 50 },
      ];

      const result = simplifyPolygon(polygon, -5);

      expect(result.simplifiedCount).toBe(4);
    });

    it('should handle complex polygons with many points', () => {
      const complex: Point[] = [];
      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const radius = 100 + (i % 2 === 0 ? 5 : -5);
        complex.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
        });
      }

      const result = simplifyPolygon(complex, 15);

      expect(result.originalCount).toBe(50);
      expect(result.simplifiedCount).toBeLessThan(50);
      expect(result.simplifiedCount).toBeGreaterThanOrEqual(3);
    });

    it('should maintain at least 3 points for valid polygon', () => {
      const nearLine: Point[] = [
        { x: 0, y: 0 },
        { x: 25, y: 1 },
        { x: 50, y: 0 },
        { x: 75, y: 1 },
        { x: 100, y: 0 },
      ];

      const result = simplifyPolygon(nearLine, 100);

      expect(result.simplifiedCount).toBeGreaterThanOrEqual(3);
    });

    it('should track kept indices correctly', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];

      const result = simplifyPolygon(points, 5);

      expect(result.keptIndices).toContain(0);
      expect(result.keptIndices).toContain(points.length - 1);
      expect(result.keptIndices.length).toBe(result.simplifiedCount);
    });

    it('should produce sorted indices', () => {
      const polygon: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 50, y: 150 },
        { x: 0, y: 100 },
      ];

      const result = simplifyPolygon(polygon, 5);

      for (let i = 1; i < result.keptIndices.length; i++) {
        expect(result.keptIndices[i]).toBeGreaterThan(result.keptIndices[i - 1]);
      }
    });
  });

  describe('previewSimplification', () => {
    it('should separate kept and removed points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 50, y: 0 },
        { x: 75, y: 0 },
        { x: 100, y: 0 },
      ];

      const preview = previewSimplification(points, 1);

      expect(preview.kept.length + preview.removed.length).toBe(points.length);
      expect(preview.keptIndices.length).toBe(preview.kept.length);
      expect(preview.removedIndices.length).toBe(preview.removed.length);
    });

    it('should have no removed points for triangles', () => {
      const triangle: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ];

      const preview = previewSimplification(triangle, 50);

      expect(preview.removed).toHaveLength(0);
      expect(preview.kept).toHaveLength(3);
    });

    it('should correctly identify removed indices for larger polygon', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 50, y: 0 },
        { x: 75, y: 0 },
        { x: 100, y: 0 },
      ];

      const preview = previewSimplification(points, 1);

      expect(preview.keptIndices).toContain(0);
      expect(preview.keptIndices).toContain(4);
      expect(preview.keptIndices.length).toBeGreaterThanOrEqual(3);
      expect(preview.removed.length).toBeGreaterThan(0);
    });
  });

  describe('isPointInPolygon', () => {
    const square: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    it('should return true for point inside polygon', () => {
      expect(isPointInPolygon({ x: 50, y: 50 }, square)).toBe(true);
    });

    it('should return false for point outside polygon', () => {
      expect(isPointInPolygon({ x: 150, y: 50 }, square)).toBe(false);
    });

    it('should handle point at origin inside polygon', () => {
      const polygon: Point[] = [
        { x: -50, y: -50 },
        { x: 50, y: -50 },
        { x: 50, y: 50 },
        { x: -50, y: 50 },
      ];
      expect(isPointInPolygon({ x: 0, y: 0 }, polygon)).toBe(true);
    });
  });

  describe('pointToSegmentDistance', () => {
    it('should return 0 for point on segment', () => {
      const dist = pointToSegmentDistance(
        { x: 50, y: 0 },
        { x: 0, y: 0 },
        { x: 100, y: 0 }
      );
      expect(dist).toBeCloseTo(0, 5);
    });

    it('should return perpendicular distance', () => {
      const dist = pointToSegmentDistance(
        { x: 50, y: 10 },
        { x: 0, y: 0 },
        { x: 100, y: 0 }
      );
      expect(dist).toBeCloseTo(10, 5);
    });

    it('should return distance to endpoint when projection is outside segment', () => {
      const dist = pointToSegmentDistance(
        { x: -10, y: 0 },
        { x: 0, y: 0 },
        { x: 100, y: 0 }
      );
      expect(dist).toBeCloseTo(10, 5);
    });

    it('should handle zero-length segment', () => {
      const dist = pointToSegmentDistance(
        { x: 10, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 }
      );
      expect(dist).toBeCloseTo(10, 5);
    });
  });
});
