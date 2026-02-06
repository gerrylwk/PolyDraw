import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PathOverlay } from '../../../src/components/Canvas/PathOverlay';
import { PathTestPoint, PolygonShape } from '../../../src/types';

const makePoint = (
  overrides: Partial<PathTestPoint> & { x: number; y: number; index: number }
): PathTestPoint => ({
  status: 'inside',
  containingPolygons: [],
  validFormat: true,
  ...overrides,
});

const makeShape = (id: string, name: string): PolygonShape => ({
  id,
  type: 'polygon',
  name,
  points: [],
  style: { color: { r: 0, g: 0, b: 0 }, opacity: 0.5 },
  pointElements: [],
});

describe('PathOverlay', () => {
  const defaultShapes = [
    makeShape('shape-1', 'Zone A'),
    makeShape('shape-2', 'Zone B'),
  ];

  describe('rendering', () => {
    it('should return null when no valid points exist', () => {
      const { container } = render(
        <PathOverlay
          testPath={[makePoint({ x: 10, y: 20, index: 0, validFormat: false })]}
          shapes={defaultShapes}
          hoveredPointIndex={null}
        />
      );
      expect(container.querySelector('svg')).toBeNull();
    });

    it('should render SVG with path and circles for valid points', () => {
      const points = [
        makePoint({ x: 10, y: 20, index: 0 }),
        makePoint({ x: 30, y: 40, index: 1, status: 'outside' }),
      ];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={null} />
      );

      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();

      const path = svg!.querySelector('path');
      expect(path).not.toBeNull();
      expect(path!.getAttribute('d')).toBe('M 10 20 L 30 40');

      const circles = svg!.querySelectorAll('circle');
      expect(circles.length).toBe(2);
    });

    it('should filter out invalid points', () => {
      const points = [
        makePoint({ x: 10, y: 20, index: 0 }),
        makePoint({ x: 0, y: 0, index: 1, validFormat: false }),
        makePoint({ x: 50, y: 60, index: 2 }),
      ];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={null} />
      );

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2);
    });
  });

  describe('status label boxes are removed', () => {
    it('should not render any rect elements when no point is hovered', () => {
      const points = [
        makePoint({ x: 10, y: 20, index: 0, status: 'inside' }),
        makePoint({ x: 30, y: 40, index: 1, status: 'outside' }),
        makePoint({ x: 50, y: 60, index: 2, status: 'edge' }),
      ];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={null} />
      );

      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBe(0);
    });

    it('should not render status text labels (IN/OUT/EDGE) on points', () => {
      const points = [
        makePoint({ x: 10, y: 20, index: 0, status: 'inside' }),
        makePoint({ x: 30, y: 40, index: 1, status: 'outside' }),
        makePoint({ x: 50, y: 60, index: 2, status: 'edge' }),
      ];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={null} />
      );

      const texts = container.querySelectorAll('text');
      const textContents = Array.from(texts).map(t => t.textContent);
      expect(textContents).not.toContain('IN');
      expect(textContents).not.toContain('OUT');
      expect(textContents).not.toContain('EDGE');
    });
  });

  describe('point circle styling', () => {
    it('should apply correct fill color based on status', () => {
      const points = [
        makePoint({ x: 10, y: 20, index: 0, status: 'inside' }),
        makePoint({ x: 30, y: 40, index: 1, status: 'outside' }),
        makePoint({ x: 50, y: 60, index: 2, status: 'edge' }),
      ];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={null} />
      );

      const circles = container.querySelectorAll('circle');
      expect(circles[0].getAttribute('fill')).toBe('#10b981');
      expect(circles[1].getAttribute('fill')).toBe('#ef4444');
      expect(circles[2].getAttribute('fill')).toBe('#0ea5e9');
    });

    it('should use default radius for non-hovered points', () => {
      const points = [makePoint({ x: 10, y: 20, index: 0 })];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={null} />
      );

      const circle = container.querySelector('circle')!;
      expect(circle.getAttribute('r')).toBe('3.5');
    });

    it('should use larger radius for hovered point', () => {
      const points = [makePoint({ x: 10, y: 20, index: 0 })];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={0} />
      );

      const circle = container.querySelector('circle')!;
      expect(circle.getAttribute('r')).toBe('5');
    });
  });

  describe('hover tooltip', () => {
    it('should not show tooltip when no point is hovered', () => {
      const points = [makePoint({ x: 10, y: 20, index: 0 })];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={null} />
      );

      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBe(0);
    });

    it('should show tooltip when a point is hovered', () => {
      const points = [makePoint({ x: 100, y: 200, index: 0 })];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={0} />
      );

      const rect = container.querySelector('rect');
      expect(rect).not.toBeNull();
      expect(rect!.getAttribute('fill')).toBe('rgba(0,0,0,0.85)');
    });

    it('should display point index and coordinates in tooltip', () => {
      const points = [makePoint({ x: 123.7, y: 456.2, index: 0 })];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={0} />
      );

      const texts = container.querySelectorAll('text');
      const coordText = Array.from(texts).find(t =>
        t.textContent?.includes('#1')
      );
      expect(coordText).not.toBeUndefined();
      expect(coordText!.textContent).toContain('124');
      expect(coordText!.textContent).toContain('456');
    });

    it('should display containing polygon names in tooltip', () => {
      const points = [
        makePoint({ x: 10, y: 20, index: 0, containingPolygons: ['shape-1', 'shape-2'] }),
      ];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={0} />
      );

      const texts = container.querySelectorAll('text');
      const polyText = Array.from(texts).find(t =>
        t.textContent?.includes('Zone A')
      );
      expect(polyText).not.toBeUndefined();
      expect(polyText!.textContent).toContain('Zone B');
      expect(polyText!.getAttribute('fill')).toBe('#a5f3fc');
    });

    it('should not render polygon name text when there are no containing polygons', () => {
      const points = [makePoint({ x: 10, y: 20, index: 0, containingPolygons: [] })];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={0} />
      );

      const texts = container.querySelectorAll('text');
      expect(texts.length).toBe(1);
    });

    it('should render tooltip after all circles (topmost layer)', () => {
      const points = [
        makePoint({ x: 10, y: 20, index: 0 }),
        makePoint({ x: 30, y: 40, index: 1 }),
        makePoint({ x: 50, y: 60, index: 2 }),
      ];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={1} />
      );

      const svg = container.querySelector('svg')!;
      const children = Array.from(svg.children);

      const lastChild = children[children.length - 1];
      expect(lastChild.tagName).toBe('g');

      const tooltipRect = lastChild.querySelector('rect');
      expect(tooltipRect).not.toBeNull();
      expect(tooltipRect!.getAttribute('fill')).toBe('rgba(0,0,0,0.85)');

      const circles = svg.querySelectorAll('circle');
      const lastCircle = circles[circles.length - 1];
      const circleIndex = children.indexOf(lastCircle);
      const tooltipIndex = children.indexOf(lastChild);
      expect(tooltipIndex).toBeGreaterThan(circleIndex);
    });

    it('should not show tooltip for a hovered index that has no matching valid point', () => {
      const points = [makePoint({ x: 10, y: 20, index: 0 })];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={5} />
      );

      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBe(0);
    });

    it('should fall back to raw ID when shape name is not found', () => {
      const points = [
        makePoint({ x: 10, y: 20, index: 0, containingPolygons: ['unknown-id'] }),
      ];

      const { container } = render(
        <PathOverlay testPath={points} shapes={defaultShapes} hoveredPointIndex={0} />
      );

      const texts = container.querySelectorAll('text');
      const polyText = Array.from(texts).find(t =>
        t.textContent?.includes('unknown-id')
      );
      expect(polyText).not.toBeUndefined();
    });
  });
});
