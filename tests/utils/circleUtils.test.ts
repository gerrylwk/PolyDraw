import { describe, it, expect } from 'vitest';
import { 
  createCircleFromPoints, 
  updateCircleFromPoints, 
  getCirclePointsForSVG 
} from '../../src/utils/circleUtils';
import { Point, CircleShape } from '../../src/types';

describe('circleUtils', () => {
  describe('createCircleFromPoints', () => {
    it('should create a circle with correct radius from center and edge point', () => {
      const center: Point = { x: 0, y: 0 };
      const edgePoint: Point = { x: 3, y: 4 };
      
      const circle = createCircleFromPoints(center, edgePoint, 'Test Circle');
      
      expect(circle.type).toBe('circle');
      expect(circle.name).toBe('Test Circle');
      expect(circle.center).toEqual(center);
      expect(circle.radius).toBe(5); // 3-4-5 right triangle
      expect(circle.points).toEqual([center, edgePoint]);
    });

    it('should calculate radius correctly for horizontal line', () => {
      const center: Point = { x: 0, y: 0 };
      const edgePoint: Point = { x: 10, y: 0 };
      
      const circle = createCircleFromPoints(center, edgePoint, 'Horizontal Circle');
      
      expect(circle.radius).toBe(10);
    });

    it('should calculate radius correctly for vertical line', () => {
      const center: Point = { x: 0, y: 0 };
      const edgePoint: Point = { x: 0, y: 7 };
      
      const circle = createCircleFromPoints(center, edgePoint, 'Vertical Circle');
      
      expect(circle.radius).toBe(7);
    });

    it('should create circle with radius 0 when center and edge are same point', () => {
      const center: Point = { x: 5, y: 5 };
      const edgePoint: Point = { x: 5, y: 5 };
      
      const circle = createCircleFromPoints(center, edgePoint, 'Zero Circle');
      
      expect(circle.radius).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const center: Point = { x: -3, y: -4 };
      const edgePoint: Point = { x: 0, y: 0 };
      
      const circle = createCircleFromPoints(center, edgePoint, 'Negative Circle');
      
      expect(circle.radius).toBe(5);
    });

    it('should create circle with default style', () => {
      const center: Point = { x: 0, y: 0 };
      const edgePoint: Point = { x: 1, y: 1 };
      
      const circle = createCircleFromPoints(center, edgePoint, 'Styled Circle');
      
      expect(circle.style).toBeDefined();
      expect(circle.style.color).toBeDefined();
      expect(circle.style.opacity).toBeDefined();
    });

    it('should create circle with unique ID', () => {
      const center: Point = { x: 0, y: 0 };
      const edgePoint: Point = { x: 1, y: 0 };
      
      const circle1 = createCircleFromPoints(center, edgePoint, 'Circle 1');
      const circle2 = createCircleFromPoints(center, edgePoint, 'Circle 2');
      
      expect(circle1.id).not.toBe(circle2.id);
    });

    it('should initialize empty arrays and undefined elements', () => {
      const center: Point = { x: 0, y: 0 };
      const edgePoint: Point = { x: 1, y: 0 };
      
      const circle = createCircleFromPoints(center, edgePoint, 'New Circle');
      
      expect(circle.pointElements).toEqual([]);
      expect(circle.element).toBeUndefined();
      expect(circle.svg).toBeUndefined();
      expect(circle.nameElement).toBeUndefined();
    });

    it('should calculate radius using Pythagorean theorem', () => {
      const center: Point = { x: 1, y: 2 };
      const edgePoint: Point = { x: 4, y: 6 };
      
      const circle = createCircleFromPoints(center, edgePoint, 'Pythagorean Circle');
      
      const expectedRadius = Math.sqrt(Math.pow(4 - 1, 2) + Math.pow(6 - 2, 2));
      expect(circle.radius).toBe(expectedRadius);
      expect(circle.radius).toBe(5);
    });
  });

  describe('updateCircleFromPoints', () => {
    const baseCircle: CircleShape = {
      id: 'test-circle',
      type: 'circle',
      name: 'Base Circle',
      center: { x: 0, y: 0 },
      radius: 5,
      points: [{ x: 0, y: 0 }, { x: 5, y: 0 }],
      style: { color: { r: 255, g: 0, b: 0 }, opacity: 0.5, strokeWidth: 2 },
      pointElements: [],
    };

    it('should update circle with new center and edge point', () => {
      const newCenter: Point = { x: 10, y: 10 };
      const newEdgePoint: Point = { x: 13, y: 14 };
      
      const updatedCircle = updateCircleFromPoints(baseCircle, newCenter, newEdgePoint);
      
      expect(updatedCircle.center).toEqual(newCenter);
      expect(updatedCircle.radius).toBe(5); // 3-4-5 triangle
      expect(updatedCircle.points).toEqual([newCenter, newEdgePoint]);
    });

    it('should preserve existing circle properties', () => {
      const newCenter: Point = { x: 5, y: 5 };
      const newEdgePoint: Point = { x: 8, y: 9 };
      
      const updatedCircle = updateCircleFromPoints(baseCircle, newCenter, newEdgePoint);
      
      expect(updatedCircle.id).toBe(baseCircle.id);
      expect(updatedCircle.type).toBe(baseCircle.type);
      expect(updatedCircle.name).toBe(baseCircle.name);
      expect(updatedCircle.style).toEqual(baseCircle.style);
    });

    it('should update radius when edge point changes', () => {
      const newCenter: Point = { x: 0, y: 0 };
      const newEdgePoint: Point = { x: 0, y: 10 };
      
      const updatedCircle = updateCircleFromPoints(baseCircle, newCenter, newEdgePoint);
      
      expect(updatedCircle.radius).toBe(10);
    });

    it('should handle zero radius update', () => {
      const newCenter: Point = { x: 7, y: 7 };
      const newEdgePoint: Point = { x: 7, y: 7 };
      
      const updatedCircle = updateCircleFromPoints(baseCircle, newCenter, newEdgePoint);
      
      expect(updatedCircle.radius).toBe(0);
    });

    it('should calculate new radius correctly', () => {
      const newCenter: Point = { x: 0, y: 0 };
      const newEdgePoint: Point = { x: 6, y: 8 };
      
      const updatedCircle = updateCircleFromPoints(baseCircle, newCenter, newEdgePoint);
      
      expect(updatedCircle.radius).toBe(10);
    });
  });

  describe('getCirclePointsForSVG', () => {
    it('should return 32 points approximating a circle', () => {
      const circle: CircleShape = {
        id: 'svg-circle',
        type: 'circle',
        name: 'SVG Circle',
        center: { x: 0, y: 0 },
        radius: 10,
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }],
        style: { color: { r: 0, g: 0, b: 255 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };
      
      const svgPoints = getCirclePointsForSVG(circle);
      const pointsArray = svgPoints.split(' ');
      
      expect(pointsArray).toHaveLength(32);
    });

    it('should generate points in correct format "x,y"', () => {
      const circle: CircleShape = {
        id: 'format-circle',
        type: 'circle',
        name: 'Format Circle',
        center: { x: 0, y: 0 },
        radius: 5,
        points: [{ x: 0, y: 0 }, { x: 5, y: 0 }],
        style: { color: { r: 0, g: 255, b: 0 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };
      
      const svgPoints = getCirclePointsForSVG(circle);
      const pointsArray = svgPoints.split(' ');
      
      pointsArray.forEach(point => {
        // Format allows scientific notation (e.g., 3.061616997868383e-16,5)
        expect(point).toMatch(/^-?[\d.e+-]+,-?[\d.e+-]+$/);
      });
    });

    it('should start at angle 0 (rightmost point)', () => {
      const circle: CircleShape = {
        id: 'angle-circle',
        type: 'circle',
        name: 'Angle Circle',
        center: { x: 0, y: 0 },
        radius: 10,
        points: [{ x: 0, y: 0 }, { x: 10, y: 0 }],
        style: { color: { r: 0, g: 255, b: 0 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };
      
      const svgPoints = getCirclePointsForSVG(circle);
      const firstPoint = svgPoints.split(' ')[0];
      const [x, y] = firstPoint.split(',').map(Number);
      
      expect(x).toBeCloseTo(10, 5); // radius at 0 degrees
      expect(y).toBeCloseTo(0, 5);
    });

    it('should handle circle with non-zero center', () => {
      const circle: CircleShape = {
        id: 'offset-circle',
        type: 'circle',
        name: 'Offset Circle',
        center: { x: 50, y: 50 },
        radius: 20,
        points: [{ x: 50, y: 50 }, { x: 70, y: 50 }],
        style: { color: { r: 255, g: 255, b: 0 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };
      
      const svgPoints = getCirclePointsForSVG(circle);
      const firstPoint = svgPoints.split(' ')[0];
      const [x, y] = firstPoint.split(',').map(Number);
      
      expect(x).toBeCloseTo(70, 5); // center.x + radius
      expect(y).toBeCloseTo(50, 5); // center.y
    });

    it('should distribute points evenly around circle', () => {
      const circle: CircleShape = {
        id: 'even-circle',
        type: 'circle',
        name: 'Even Circle',
        center: { x: 0, y: 0 },
        radius: 100,
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        style: { color: { r: 128, g: 128, b: 128 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };
      
      const svgPoints = getCirclePointsForSVG(circle);
      const pointsArray = svgPoints.split(' ');
      
      // Check that points are distributed around the circle
      // Point at index 8 should be at 90 degrees (top)
      const topPoint = pointsArray[8].split(',').map(Number);
      expect(topPoint[0]).toBeCloseTo(0, 1);
      expect(topPoint[1]).toBeCloseTo(100, 1);
      
      // Point at index 16 should be at 180 degrees (left)
      const leftPoint = pointsArray[16].split(',').map(Number);
      expect(leftPoint[0]).toBeCloseTo(-100, 1);
      expect(leftPoint[1]).toBeCloseTo(0, 1);
      
      // Point at index 24 should be at 270 degrees (bottom)
      const bottomPoint = pointsArray[24].split(',').map(Number);
      expect(bottomPoint[0]).toBeCloseTo(0, 1);
      expect(bottomPoint[1]).toBeCloseTo(-100, 1);
    });

    it('should handle zero radius circle', () => {
      const circle: CircleShape = {
        id: 'zero-circle',
        type: 'circle',
        name: 'Zero Circle',
        center: { x: 10, y: 10 },
        radius: 0,
        points: [{ x: 10, y: 10 }, { x: 10, y: 10 }],
        style: { color: { r: 0, g: 0, b: 0 }, opacity: 0.5, strokeWidth: 2 },
        pointElements: [],
      };
      
      const svgPoints = getCirclePointsForSVG(circle);
      const pointsArray = svgPoints.split(' ');
      
      // All points should be at center
      pointsArray.forEach(point => {
        const [x, y] = point.split(',').map(Number);
        expect(x).toBeCloseTo(10, 5);
        expect(y).toBeCloseTo(10, 5);
      });
    });
  });
});

