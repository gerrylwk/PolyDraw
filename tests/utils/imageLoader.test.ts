import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadImageOptimized, createImageFromBitmap, terminateWorker } from '../../src/utils/imageLoader';

describe('imageLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    terminateWorker();
  });

  describe('loadImageOptimized', () => {
    it('should load and process an image file', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = {
        name: 'test.jpg',
        type: 'image/jpeg',
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      } as unknown as File;

      const mockImageBitmap = {
        width: 800,
        height: 600,
        close: vi.fn()
      } as unknown as ImageBitmap;

      global.createImageBitmap = vi.fn().mockResolvedValue(mockImageBitmap);

      const result = await loadImageOptimized(mockFile);

      expect(result).toBeDefined();
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.originalWidth).toBe(800);
      expect(result.originalHeight).toBe(600);
      expect(result.wasResized).toBe(false);
    });

    it('should resize image if dimensions exceed maximum', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = {
        name: 'large.jpg',
        type: 'image/jpeg',
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      } as unknown as File;

      const largeBitmap = {
        width: 8000,
        height: 6000,
        close: vi.fn()
      } as unknown as ImageBitmap;

      const resizedBitmap = {
        width: 4096,
        height: 3072,
        close: vi.fn()
      } as unknown as ImageBitmap;

      global.createImageBitmap = vi.fn()
        .mockResolvedValueOnce(largeBitmap)
        .mockResolvedValueOnce(resizedBitmap);

      const result = await loadImageOptimized(mockFile, {
        maxWidth: 4096,
        maxHeight: 4096
      });

      expect(result.wasResized).toBe(true);
      expect(result.width).toBe(4096);
      expect(result.height).toBe(3072);
      expect(result.originalWidth).toBe(8000);
      expect(result.originalHeight).toBe(6000);
      expect(largeBitmap.close).toHaveBeenCalled();
    });

    it('should call progress callback during loading', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = {
        name: 'test.jpg',
        type: 'image/jpeg',
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      } as unknown as File;
      const progressCallback = vi.fn();

      const mockImageBitmap = {
        width: 800,
        height: 600,
        close: vi.fn()
      } as unknown as ImageBitmap;

      global.createImageBitmap = vi.fn().mockResolvedValue(mockImageBitmap);

      await loadImageOptimized(mockFile, {
        onProgress: progressCallback
      });

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls.length).toBeGreaterThan(0);
    });

    it('should handle custom max dimensions', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = {
        name: 'test.jpg',
        type: 'image/jpeg',
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      } as unknown as File;

      const largeBitmap = {
        width: 3000,
        height: 2000,
        close: vi.fn()
      } as unknown as ImageBitmap;

      const resizedBitmap = {
        width: 2048,
        height: 1365,
        close: vi.fn()
      } as unknown as ImageBitmap;

      global.createImageBitmap = vi.fn()
        .mockResolvedValueOnce(largeBitmap)
        .mockResolvedValueOnce(resizedBitmap);

      const result = await loadImageOptimized(mockFile, {
        maxWidth: 2048,
        maxHeight: 2048
      });

      expect(result.wasResized).toBe(true);
      expect(result.width).toBeLessThanOrEqual(2048);
    });

    it('should maintain aspect ratio when resizing', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockFile = {
        name: 'test.jpg',
        type: 'image/jpeg',
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      } as unknown as File;

      const largeBitmap = {
        width: 8000,
        height: 4000,
        close: vi.fn()
      } as unknown as ImageBitmap;

      const resizedBitmap = {
        width: 4096,
        height: 2048,
        close: vi.fn()
      } as unknown as ImageBitmap;

      global.createImageBitmap = vi.fn()
        .mockResolvedValueOnce(largeBitmap)
        .mockResolvedValueOnce(resizedBitmap);

      const result = await loadImageOptimized(mockFile, {
        maxWidth: 4096,
        maxHeight: 4096
      });

      const originalRatio = 8000 / 4000;
      const resizedRatio = result.width / result.height;

      expect(Math.abs(originalRatio - resizedRatio)).toBeLessThan(0.01);
    });
  });

  describe('createImageFromBitmap', () => {
    it('should create an HTMLImageElement from ImageBitmap', () => {
      const mockImageBitmap = {
        width: 800,
        height: 600,
        close: vi.fn()
      } as unknown as ImageBitmap;

      const img = createImageFromBitmap(mockImageBitmap);

      expect(img).toBeInstanceOf(HTMLImageElement);
      expect(img.className).toContain('transform-gpu');
      expect(img.decoding).toBe('async');
      expect(img.loading).toBe('eager');
      expect(img.style.imageRendering).toBe('high-quality');
    });

    it('should configure canvas with high quality settings', () => {
      const mockCanvas = document.createElement('canvas');
      const mockContext = {
        drawImage: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low'
      } as unknown as CanvasRenderingContext2D;

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
      vi.spyOn(mockCanvas, 'toDataURL').mockReturnValue('data:image/png;base64,mock');

      const mockImageBitmap = {
        width: 800,
        height: 600,
        close: vi.fn()
      } as unknown as ImageBitmap;

      createImageFromBitmap(mockImageBitmap);

      expect(mockContext.imageSmoothingEnabled).toBe(true);
      expect(mockContext.imageSmoothingQuality).toBe('high');
    });

    it('should throw error if canvas context is not available', () => {
      const mockCanvas = document.createElement('canvas');
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(null);

      const mockImageBitmap = {
        width: 800,
        height: 600,
        close: vi.fn()
      } as unknown as ImageBitmap;

      expect(() => createImageFromBitmap(mockImageBitmap)).toThrow('Failed to get canvas context');
    });

    it('should set correct image dimensions on canvas', () => {
      const mockCanvas = document.createElement('canvas');
      const mockContext = {
        drawImage: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low'
      } as unknown as CanvasRenderingContext2D;

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
      vi.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
      vi.spyOn(mockCanvas, 'toDataURL').mockReturnValue('data:image/png;base64,mock');

      const mockImageBitmap = {
        width: 1920,
        height: 1080,
        close: vi.fn()
      } as unknown as ImageBitmap;

      createImageFromBitmap(mockImageBitmap);

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);
    });
  });

  describe('terminateWorker', () => {
    it('should not throw error when called', () => {
      expect(() => terminateWorker()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        terminateWorker();
        terminateWorker();
        terminateWorker();
      }).not.toThrow();
    });
  });
});
