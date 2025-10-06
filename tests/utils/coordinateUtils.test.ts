import { describe, it, expect } from 'vitest';
import { 
  normalizeCoordinates, 
  denormalizeCoordinates,
  straightenLine
} from '../../src/utils/coordinateUtils';
import { Point, ImageInfo } from '../../src/types';

describe('coordinateUtils', () => {
  // Mock image with createElement to simulate loaded image
  const mockImage = document.createElement('img');
  mockImage.width = 800;
  mockImage.height = 600;
  Object.defineProperty(mockImage, 'naturalWidth', { value: 800 });
  Object.defineProperty(mockImage, 'naturalHeight', { value: 600 });

  const mockImageInfo: ImageInfo = {
    element: mockImage,
    fileName: 'test.jpg',
    width: 800,
    height: 600,
    naturalWidth: 800,
    naturalHeight: 600,
  };

  describe('normalizeCoordinates', () => {
    it('should normalize a single point to 0-1 range', () => {
      const point: Point = { x: 400, y: 300 };
      const normalized = normalizeCoordinates(point, mockImageInfo);

      expect(normalized).toEqual({ x: 0.5, y: 0.5 });
    });

    it('should handle zero coordinates', () => {
      const point: Point = { x: 0, y: 0 };
      const normalized = normalizeCoordinates(point, mockImageInfo);

      expect(normalized).toEqual({ x: 0, y: 0 });
    });

    it('should handle max coordinates', () => {
      const point: Point = { x: 800, y: 600 };
      const normalized = normalizeCoordinates(point, mockImageInfo);

      expect(normalized).toEqual({ x: 1, y: 1 });
    });

    it('should return original point if no image element', () => {
      const noImageInfo: ImageInfo = {
        element: null,
        fileName: '',
        width: 0,
        height: 0,
      };
      const point: Point = { x: 100, y: 100 };
      const normalized = normalizeCoordinates(point, noImageInfo);

      expect(normalized).toEqual(point);
    });
  });

  describe('denormalizeCoordinates', () => {
    it('should convert normalized point to pixel coordinates', () => {
      const normalizedPoint: Point = { x: 0.5, y: 0.5 };
      const denormalized = denormalizeCoordinates(normalizedPoint, mockImageInfo);

      expect(denormalized).toEqual({ x: 400, y: 300 });
    });

    it('should handle zero coordinates', () => {
      const normalizedPoint: Point = { x: 0, y: 0 };
      const denormalized = denormalizeCoordinates(normalizedPoint, mockImageInfo);

      expect(denormalized).toEqual({ x: 0, y: 0 });
    });

    it('should handle max coordinates', () => {
      const normalizedPoint: Point = { x: 1, y: 1 };
      const denormalized = denormalizeCoordinates(normalizedPoint, mockImageInfo);

      expect(denormalized).toEqual({ x: 800, y: 600 });
    });

    it('should return original point if no image element', () => {
      const noImageInfo: ImageInfo = {
        element: null,
        fileName: '',
        width: 0,
        height: 0,
      };
      const point: Point = { x: 0.5, y: 0.5 };
      const denormalized = denormalizeCoordinates(point, noImageInfo);

      expect(denormalized).toEqual(point);
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain accuracy through normalize and denormalize', () => {
      const originalPoint: Point = { x: 100, y: 200 };

      const normalized = normalizeCoordinates(originalPoint, mockImageInfo);
      const denormalized = denormalizeCoordinates(normalized, mockImageInfo);

      expect(denormalized.x).toBeCloseTo(originalPoint.x, 0);
      expect(denormalized.y).toBeCloseTo(originalPoint.y, 0);
    });
  });

  describe('straightenLine', () => {
    it('should straighten horizontal line', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 100, y: 10 }; // Nearly horizontal

      const straightened = straightenLine(start, end);

      expect(straightened.y).toBeCloseTo(0, 0);
    });

    it('should straighten vertical line', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 10, y: 100 }; // Nearly vertical

      const straightened = straightenLine(start, end);

      expect(straightened.x).toBeCloseTo(0, 0);
    });

    it('should straighten 45-degree line', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 95, y: 105 }; // Nearly 45 degrees

      const straightened = straightenLine(start, end);

      // Should be roughly equal x and y for 45 degrees
      expect(Math.abs(straightened.x - straightened.y)).toBeLessThan(5);
    });
  });
});

