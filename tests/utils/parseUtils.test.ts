import { describe, it, expect } from 'vitest';
import {
  parsePythonString,
  generateSVGString,
} from '../../src/utils/parseUtils';
import { PolygonShape, ImageInfo } from '../../src/types';

describe('parseUtils', () => {
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

  describe('parsePythonString', () => {
    it('should parse single polygon from Python string', () => {
      const pythonString = '[(0, 0), (100, 0), (100, 100), (0, 100)]';
      const shapes = parsePythonString(pythonString, false, undefined, 0.5);

      expect(shapes).toHaveLength(1);
      expect(shapes[0].points).toHaveLength(4);
      expect(shapes[0].points[0]).toEqual({ x: 0, y: 0 });
      expect(shapes[0].style.opacity).toBe(0.5);
    });

    it('should parse multiple polygons from Python string', () => {
      const pythonString = `[(0, 0), (50, 0), (50, 50)]
[(100, 100), (150, 100), (150, 150), (100, 150)]`;
      const shapes = parsePythonString(pythonString);

      expect(shapes).toHaveLength(2);
      expect(shapes[0].points).toHaveLength(3);
      expect(shapes[1].points).toHaveLength(4);
    });

    it('should handle normalized coordinates', () => {
      const pythonString = '[(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]';
      const shapes = parsePythonString(pythonString, true, mockImageInfo);

      expect(shapes).toHaveLength(1);
      expect(shapes[0].points[0]).toEqual({ x: 0, y: 0 });
      expect(shapes[0].points[1]).toEqual({ x: 800, y: 0 });
      expect(shapes[0].points[2]).toEqual({ x: 800, y: 600 });
    });

    it('should generate unique IDs for shapes', () => {
      const pythonString = `[(0, 0), (50, 0), (50, 50)]
[(100, 100), (150, 100), (150, 150)]`;
      const shapes = parsePythonString(pythonString);

      expect(shapes[0].id).not.toBe(shapes[1].id);
      expect(typeof shapes[0].id).toBe('string');
      expect(typeof shapes[1].id).toBe('string');
    });

    it('should assign default names to shapes', () => {
      const pythonString = `[(0, 0), (50, 0), (50, 50)]
[(100, 100), (150, 100), (150, 150)]`;
      const shapes = parsePythonString(pythonString);

      expect(shapes[0].name).toBe('Polygon 1');
      expect(shapes[1].name).toBe('Polygon 2');
    });

    it('should handle empty string', () => {
      const shapes = parsePythonString('');
      expect(shapes).toHaveLength(0);
    });

    it('should handle whitespace-only string', () => {
      const shapes = parsePythonString('   \n  \t  ');
      expect(shapes).toHaveLength(0);
    });
  });

  describe('generateSVGString', () => {
    it('should generate Python-style string from shapes', () => {
      const shapes: PolygonShape[] = [
        {
          id: 'test-1',
          type: 'polygon',
          name: 'Triangle',
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 50, y: 100 },
          ],
          style: { color: { r: 255, g: 0, b: 0 }, opacity: 0.5, strokeWidth: 2 },
          pointElements: [],
        },
      ];

      const output = generateSVGString(shapes, false);

      expect(output).toContain('# Triangle');
      expect(output).toContain('0 0 100 0 50 100');
    });

    it('should generate normalized coordinates', () => {
      const shapes: PolygonShape[] = [
        {
          id: 'test-1',
          type: 'polygon',
          name: 'Square',
          points: [
            { x: 0, y: 0 },
            { x: 800, y: 0 },
            { x: 800, y: 600 },
            { x: 0, y: 600 },
          ],
          style: { color: { r: 0, g: 255, b: 0 }, opacity: 0.5, strokeWidth: 2 },
          pointElements: [],
        },
      ];

      const output = generateSVGString(shapes, true, mockImageInfo);

      expect(output).toContain('# Square');
      expect(output).toContain('0.0000 0.0000');
      expect(output).toContain('1.0000 0.0000');
    });

    it('should handle empty shapes array', () => {
      const output = generateSVGString([], false);
      expect(output).toBe('# No polygons created yet');
    });

    it('should handle multiple shapes', () => {
      const shapes: PolygonShape[] = [
        {
          id: 'test-1',
          type: 'polygon',
          name: 'Shape1',
          points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
          style: { color: { r: 255, g: 0, b: 0 }, opacity: 0.3, strokeWidth: 2 },
          pointElements: [],
        },
        {
          id: 'test-2',
          type: 'polygon',
          name: 'Shape2',
          points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
          style: { color: { r: 0, g: 0, b: 255 }, opacity: 0.7, strokeWidth: 2 },
          pointElements: [],
        },
      ];

      const output = generateSVGString(shapes, false);

      expect(output).toContain('# Shape1');
      expect(output).toContain('0 0 10 10');
      expect(output).toContain('# Shape2');
      expect(output).toContain('20 20 30 30');
    });
  });
});
