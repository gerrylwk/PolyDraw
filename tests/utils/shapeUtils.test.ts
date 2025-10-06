import { describe, it, expect } from 'vitest';
import { createShapeId, calculateShapeBounds, findPointAt } from '../../src/utils/shapeUtils';
import { PolygonShape } from '../../src/types';

describe('shapeUtils', () => {
  describe('createShapeId', () => {
    it('should create unique IDs', () => {
      const id1 = createShapeId();
      const id2 = createShapeId();
      const id3 = createShapeId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should create IDs as strings', () => {
      const id = createShapeId();
      
      // ID should be a string
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should create multiple unique IDs in sequence', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(createShapeId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(100);
    });
  });

  describe('findPointAt', () => {
    const testShapes: PolygonShape[] = [
      {
        id: 'test-1',
        type: 'polygon',
        name: 'Square',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
        style: { color: { r: 0, g: 0, b: 255 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      }
    ];

    it('should find point at exact coordinates', () => {
      const result = findPointAt(0, 0, testShapes, 1);
      
      expect(result).not.toBeNull();
      expect(result?.x).toBe(0);
      expect(result?.y).toBe(0);
      expect(result?.index).toBe(0);
    });

    it('should find point within threshold', () => {
      const result = findPointAt(5, 5, testShapes, 1);
      
      expect(result).not.toBeNull();
      expect(result?.index).toBe(0);
    });

    it('should return null when point is too far', () => {
      const result = findPointAt(50, 50, testShapes, 1);
      
      expect(result).toBeNull();
    });

    it('should adjust threshold based on scale', () => {
      // With scale = 2, threshold is halved
      const result = findPointAt(10, 10, testShapes, 2);
      
      expect(result).toBeNull(); // Too far with higher scale
    });
  });

  describe('calculateShapeBounds', () => {
    it('should calculate bounds for square polygon', () => {
      const square: PolygonShape = {
        id: 'test-1',
        type: 'polygon',
        name: 'Square',
        points: [
          { x: 10, y: 10 },
          { x: 50, y: 10 },
          { x: 50, y: 50 },
          { x: 10, y: 50 },
        ],
        style: { color: { r: 0, g: 0, b: 255 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };

      const bounds = calculateShapeBounds(square);

      expect(bounds).toEqual({
        minX: 10,
        minY: 10,
        maxX: 50,
        maxY: 50,
      });
    });

    it('should calculate bounds for triangle', () => {
      const triangle: PolygonShape = {
        id: 'test-2',
        type: 'polygon',
        name: 'Triangle',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 100 },
        ],
        style: { color: { r: 255, g: 0, b: 0 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };

      const bounds = calculateShapeBounds(triangle);

      expect(bounds).toEqual({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
      });
    });

    it('should handle single point', () => {
      const singlePoint: PolygonShape = {
        id: 'test-3',
        type: 'polygon',
        name: 'Point',
        points: [{ x: 25, y: 75 }],
        style: { color: { r: 0, g: 255, b: 0 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };

      const bounds = calculateShapeBounds(singlePoint);

      expect(bounds).toEqual({
        minX: 25,
        minY: 75,
        maxX: 25,
        maxY: 75,
      });
    });

    it('should handle negative coordinates', () => {
      const polygon: PolygonShape = {
        id: 'test-4',
        type: 'polygon',
        name: 'Negative',
        points: [
          { x: -50, y: -50 },
          { x: 50, y: -50 },
          { x: 50, y: 50 },
          { x: -50, y: 50 },
        ],
        style: { color: { r: 128, g: 128, b: 128 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };

      const bounds = calculateShapeBounds(polygon);

      expect(bounds).toEqual({
        minX: -50,
        minY: -50,
        maxX: 50,
        maxY: 50,
      });
    });

    it('should handle empty points array', () => {
      const empty: PolygonShape = {
        id: 'test-6',
        type: 'polygon',
        name: 'Empty',
        points: [],
        style: { color: { r: 0, g: 0, b: 0 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };

      const bounds = calculateShapeBounds(empty);

      expect(bounds).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
      });
    });
  });
});

