import { describe, it, expect } from 'vitest';
import { resetCanvasView, calculateZoomedPosition, updateCanvasTransform } from '../../src/utils/canvasUtils';
import { ImageInfo } from '../../src/types';

describe('canvasUtils', () => {
  describe('resetCanvasView', () => {
    it('should return default values when no image element', () => {
      const imageInfo: ImageInfo = {
        element: null,
        fileName: 'test.jpg',
        naturalWidth: 800,
        naturalHeight: 600,
      };

      const canvasContainerRef = { current: document.createElement('div') };

      const result = resetCanvasView(imageInfo, canvasContainerRef);

      expect(result).toEqual({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      });
    });

    it('should return default values when no container ref', () => {
      const mockImage = document.createElement('img');
      Object.defineProperty(mockImage, 'naturalWidth', { value: 800 });
      Object.defineProperty(mockImage, 'naturalHeight', { value: 600 });

      const imageInfo: ImageInfo = {
        element: mockImage,
        fileName: 'test.jpg',
        naturalWidth: 800,
        naturalHeight: 600,
      };

      const canvasContainerRef = { current: null };

      const result = resetCanvasView(imageInfo, canvasContainerRef);

      expect(result).toEqual({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
      });
    });

    it('should calculate scale to fit image horizontally', () => {
      const mockImage = document.createElement('img');
      Object.defineProperty(mockImage, 'naturalWidth', { value: 800 });
      Object.defineProperty(mockImage, 'naturalHeight', { value: 600 });

      const imageInfo: ImageInfo = {
        element: mockImage,
        fileName: 'test.jpg',
        naturalWidth: 800,
        naturalHeight: 600,
      };

      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 400 });
      Object.defineProperty(container, 'clientHeight', { value: 800 });

      const canvasContainerRef = { current: container };

      const result = resetCanvasView(imageInfo, canvasContainerRef);

      // Scale should be 0.5 to fit width (400 / 800)
      expect(result.scale).toBe(0.5);
      expect(result.offsetX).toBe(0); // Centered horizontally
      expect(result.offsetY).toBe(250); // Centered vertically: (800 - 600*0.5) / 2
    });

    it('should calculate scale to fit image vertically', () => {
      const mockImage = document.createElement('img');
      Object.defineProperty(mockImage, 'naturalWidth', { value: 800 });
      Object.defineProperty(mockImage, 'naturalHeight', { value: 600 });

      const imageInfo: ImageInfo = {
        element: mockImage,
        fileName: 'test.jpg',
        naturalWidth: 800,
        naturalHeight: 600,
      };

      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 1200 });
      Object.defineProperty(container, 'clientHeight', { value: 300 });

      const canvasContainerRef = { current: container };

      const result = resetCanvasView(imageInfo, canvasContainerRef);

      // Scale should be 0.5 to fit height (300 / 600)
      expect(result.scale).toBe(0.5);
      expect(result.offsetX).toBe(400); // Centered horizontally: (1200 - 800*0.5) / 2
      expect(result.offsetY).toBe(0); // Centered vertically
    });

    it('should center perfectly square image in square container', () => {
      const mockImage = document.createElement('img');
      Object.defineProperty(mockImage, 'naturalWidth', { value: 500 });
      Object.defineProperty(mockImage, 'naturalHeight', { value: 500 });

      const imageInfo: ImageInfo = {
        element: mockImage,
        fileName: 'test.jpg',
        naturalWidth: 500,
        naturalHeight: 500,
      };

      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 500 });
      Object.defineProperty(container, 'clientHeight', { value: 500 });

      const canvasContainerRef = { current: container };

      const result = resetCanvasView(imageInfo, canvasContainerRef);

      expect(result.scale).toBe(1);
      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(0);
    });
  });

  describe('calculateZoomedPosition', () => {
    it('should calculate new position when zooming in', () => {
      const result = calculateZoomedPosition(
        400, // mouseX
        300, // mouseY
        0,   // offsetX
        0,   // offsetY
        1,   // scale
        1.5  // zoomFactor (zoom in)
      );

      expect(result.newScale).toBe(1.5);
      expect(result.newOffsetX).toBe(400 - 400 * 1.5);
      expect(result.newOffsetY).toBe(300 - 300 * 1.5);
    });

    it('should calculate new position when zooming out', () => {
      const result = calculateZoomedPosition(
        400, // mouseX
        300, // mouseY
        0,   // offsetX
        0,   // offsetY
        2,   // scale
        0.5  // zoomFactor (zoom out)
      );

      expect(result.newScale).toBe(1);
      expect(result.newOffsetX).toBe(400 - 200 * 1);
      expect(result.newOffsetY).toBe(300 - 150 * 1);
    });

    it('should clamp scale to minimum 0.1', () => {
      const result = calculateZoomedPosition(
        400,
        300,
        0,
        0,
        0.2,  // current scale
        0.1   // zoom out factor
      );

      expect(result.newScale).toBe(0.1);
    });

    it('should clamp scale to maximum 10', () => {
      const result = calculateZoomedPosition(
        400,
        300,
        0,
        0,
        8,   // current scale
        2    // zoom in factor
      );

      expect(result.newScale).toBe(10);
    });

    it('should handle zooming with offset', () => {
      const result = calculateZoomedPosition(
        500, // mouseX
        400, // mouseY
        100, // offsetX
        50,  // offsetY
        1,   // scale
        2    // zoomFactor
      );

      const canvasX = (500 - 100) / 1;
      const canvasY = (400 - 50) / 1;

      expect(result.newScale).toBe(2);
      expect(result.newOffsetX).toBe(500 - canvasX * 2);
      expect(result.newOffsetY).toBe(400 - canvasY * 2);
    });

    it('should preserve zoom center point', () => {
      // When zooming at a specific point, that point should remain at the same screen position
      const mouseX = 600;
      const mouseY = 400;
      const offsetX = 50;
      const offsetY = 100;
      const scale = 1.5;
      const zoomFactor = 2;

      const result = calculateZoomedPosition(mouseX, mouseY, offsetX, offsetY, scale, zoomFactor);

      // Calculate canvas position before zoom
      const canvasXBefore = (mouseX - offsetX) / scale;
      const canvasYBefore = (mouseY - offsetY) / scale;

      // Calculate canvas position after zoom
      const canvasXAfter = (mouseX - result.newOffsetX) / result.newScale;
      const canvasYAfter = (mouseY - result.newOffsetY) / result.newScale;

      // They should be the same (zoom centered on mouse)
      expect(canvasXAfter).toBeCloseTo(canvasXBefore, 5);
      expect(canvasYAfter).toBeCloseTo(canvasYBefore, 5);
    });
  });

  describe('updateCanvasTransform', () => {
    it('should apply transform to canvas element', () => {
      const canvasElement = document.createElement('div');
      const canvasRef = { current: canvasElement };

      updateCanvasTransform(canvasRef, 100, 200, 1.5);

      expect(canvasElement.style.transform).toBe('translate(100px, 200px) scale(1.5)');
    });

    it('should handle negative offsets', () => {
      const canvasElement = document.createElement('div');
      const canvasRef = { current: canvasElement };

      updateCanvasTransform(canvasRef, -50, -75, 0.8);

      expect(canvasElement.style.transform).toBe('translate(-50px, -75px) scale(0.8)');
    });

    it('should handle zero offsets and scale of 1', () => {
      const canvasElement = document.createElement('div');
      const canvasRef = { current: canvasElement };

      updateCanvasTransform(canvasRef, 0, 0, 1);

      expect(canvasElement.style.transform).toBe('translate(0px, 0px) scale(1)');
    });

    it('should do nothing when canvasRef.current is null', () => {
      const canvasRef = { current: null };

      // Should not throw error
      expect(() => {
        updateCanvasTransform(canvasRef, 100, 200, 1.5);
      }).not.toThrow();
    });

    it('should handle decimal values', () => {
      const canvasElement = document.createElement('div');
      const canvasRef = { current: canvasElement };

      updateCanvasTransform(canvasRef, 123.456, 789.012, 2.345);

      expect(canvasElement.style.transform).toBe('translate(123.456px, 789.012px) scale(2.345)');
    });
  });
});

