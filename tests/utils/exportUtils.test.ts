import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderImageWithShapes, exportAsImage, exportAsSVG } from '../../src/utils/exportUtils';
import { Shape, ImageInfo, PolygonShape } from '../../src/types';

const createMockImageInfo = (): ImageInfo => {
  const mockImage = document.createElement('img');
  Object.defineProperty(mockImage, 'naturalWidth', { value: 800 });
  Object.defineProperty(mockImage, 'naturalHeight', { value: 600 });

  return {
    element: mockImage,
    fileName: 'test-image.png',
    naturalWidth: 800,
    naturalHeight: 600
  };
};

const createMockShape = (id: string = '1'): PolygonShape => ({
  id,
  type: 'polygon',
  name: `Shape ${id}`,
  style: {
    color: { r: 255, g: 0, b: 0 },
    opacity: 0.5,
    strokeWidth: 2
  },
  points: [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 150, y: 200 }
  ],
  pointElements: []
});

describe('exportUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!URL.createObjectURL) {
      URL.createObjectURL = vi.fn(() => 'blob:test');
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = vi.fn();
    }
  });

  describe('renderImageWithShapes', () => {
    it('should return null when no image element', () => {
      const imageInfo: ImageInfo = {
        element: null,
        fileName: 'test.png',
        naturalWidth: 800,
        naturalHeight: 600
      };

      const result = renderImageWithShapes(imageInfo, []);

      expect(result).toBeNull();
    });

    it('should create canvas with correct dimensions', () => {
      const imageInfo = createMockImageInfo();
      const shapes: Shape[] = [];

      const canvas = renderImageWithShapes(imageInfo, shapes);

      expect(canvas).not.toBeNull();
      expect(canvas?.width).toBe(800);
      expect(canvas?.height).toBe(600);
    });

    it('should render shapes on the canvas', () => {
      const imageInfo = createMockImageInfo();
      const shapes: Shape[] = [createMockShape()];

      const canvas = renderImageWithShapes(imageInfo, shapes);

      expect(canvas).not.toBeNull();
    });

    it('should skip shapes with less than 3 points', () => {
      const imageInfo = createMockImageInfo();
      const incompleteShape: PolygonShape = {
        ...createMockShape(),
        points: [{ x: 100, y: 100 }, { x: 200, y: 200 }]
      };

      const canvas = renderImageWithShapes(imageInfo, [incompleteShape]);

      expect(canvas).not.toBeNull();
    });

    it('should handle multiple shapes', () => {
      const imageInfo = createMockImageInfo();
      const shapes: Shape[] = [
        createMockShape('1'),
        createMockShape('2')
      ];

      const canvas = renderImageWithShapes(imageInfo, shapes);

      expect(canvas).not.toBeNull();
    });
  });

  describe('exportAsImage', () => {
    let originalCreateElement: typeof document.createElement;
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      originalCreateElement = document.createElement.bind(document);
      mockLink = originalCreateElement('a') as HTMLAnchorElement;
      mockLink.click = vi.fn();

      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink;
        }
        return originalCreateElement(tagName);
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return false when no image element', () => {
      vi.restoreAllMocks();
      const imageInfo: ImageInfo = {
        element: null,
        fileName: 'test.png',
        naturalWidth: 800,
        naturalHeight: 600
      };

      const result = exportAsImage(imageInfo, [], { format: 'png' });

      expect(result).toBe(false);
    });

    it('should export as PNG successfully', () => {
      const imageInfo = createMockImageInfo();
      const shapes: Shape[] = [createMockShape()];

      const result = exportAsImage(imageInfo, shapes, { format: 'png' });

      expect(result).toBe(true);
    });

    it('should export as JPEG successfully', () => {
      const imageInfo = createMockImageInfo();
      const shapes: Shape[] = [createMockShape()];

      const result = exportAsImage(imageInfo, shapes, { format: 'jpeg' });

      expect(result).toBe(true);
    });

    it('should use custom quality for JPEG', () => {
      const imageInfo = createMockImageInfo();
      const shapes: Shape[] = [];

      const result = exportAsImage(imageInfo, shapes, { format: 'jpeg', quality: 0.8 });

      expect(result).toBe(true);
    });
  });

  describe('exportAsSVG', () => {
    let originalCreateElement: typeof document.createElement;
    let mockLink: HTMLAnchorElement;

    beforeEach(() => {
      originalCreateElement = document.createElement.bind(document);
      mockLink = originalCreateElement('a') as HTMLAnchorElement;
      mockLink.click = vi.fn();

      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink;
        }
        return originalCreateElement(tagName);
      });
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
      URL.createObjectURL = vi.fn(() => 'blob:test');
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return false when no image element', () => {
      vi.restoreAllMocks();
      const imageInfo: ImageInfo = {
        element: null,
        fileName: 'test.png',
        naturalWidth: 800,
        naturalHeight: 600
      };

      const result = exportAsSVG(imageInfo, []);

      expect(result).toBe(false);
    });

    it('should export SVG successfully', () => {
      const imageInfo = createMockImageInfo();
      const shapes: Shape[] = [createMockShape()];

      const result = exportAsSVG(imageInfo, shapes);

      expect(result).toBe(true);
    });

    it('should skip shapes with less than 3 points', () => {
      const imageInfo = createMockImageInfo();
      const incompleteShape: PolygonShape = {
        ...createMockShape(),
        points: [{ x: 100, y: 100 }]
      };

      const result = exportAsSVG(imageInfo, [incompleteShape]);

      expect(result).toBe(true);
    });

    it('should handle multiple shapes', () => {
      const imageInfo = createMockImageInfo();
      const shapes: Shape[] = [
        createMockShape('1'),
        createMockShape('2')
      ];

      const result = exportAsSVG(imageInfo, shapes);

      expect(result).toBe(true);
    });

    it('should revoke object URL after download', () => {
      const imageInfo = createMockImageInfo();
      const shapes: Shape[] = [];

      exportAsSVG(imageInfo, shapes);

      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
