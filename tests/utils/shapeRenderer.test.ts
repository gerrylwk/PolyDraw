import { describe, it, expect, beforeEach } from 'vitest';
import {
  PolygonRenderer,
  CircleRenderer,
  ShapeRendererFactory,
  createShapeSVG,
  updateShapeDisplay,
} from '../../src/utils/shapeRenderer';
import { PolygonShape, CircleShape } from '../../src/types';

describe('shapeRenderer', () => {
  describe('PolygonRenderer', () => {
    let renderer: PolygonRenderer;
    let polygonShape: PolygonShape;

    beforeEach(() => {
      renderer = new PolygonRenderer();
      polygonShape = {
        id: 'test-polygon',
        type: 'polygon',
        name: 'Test Polygon',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 100 },
        ],
        style: {
          color: { r: 255, g: 0, b: 0 },
          opacity: 0.5,
          strokeWidth: 2,
        },
        pointElements: [],
      };
    });

    describe('createSVGElement', () => {
      it('should create SVG polygon element', () => {
        const element = renderer.createSVGElement(polygonShape);

        // Check element type by tagName since SVGPolygonElement may not be available in jsdom
        expect(element.tagName).toBe('polygon');
        expect(element.namespaceURI).toBe('http://www.w3.org/2000/svg');
      });
    });

    describe('updatePoints', () => {
      it('should set points attribute on polygon element', () => {
        const element = renderer.createSVGElement(polygonShape);
        polygonShape.element = element;

        renderer.updatePoints(polygonShape);

        expect(element.getAttribute('points')).toBe('0,0 100,0 50,100');
      });

      it('should handle empty points array', () => {
        const element = renderer.createSVGElement(polygonShape);
        polygonShape.element = element;
        polygonShape.points = [];

        renderer.updatePoints(polygonShape);

        expect(element.getAttribute('points')).toBe('');
      });

      it('should not throw if element is undefined', () => {
        polygonShape.element = undefined;

        expect(() => renderer.updatePoints(polygonShape)).not.toThrow();
      });

      it('should update points when shape changes', () => {
        const element = renderer.createSVGElement(polygonShape);
        polygonShape.element = element;
        polygonShape.points = [
          { x: 10, y: 20 },
          { x: 30, y: 40 },
        ];

        renderer.updatePoints(polygonShape);

        expect(element.getAttribute('points')).toBe('10,20 30,40');
      });
    });

    describe('applyStyle', () => {
      it('should apply color to fill and stroke', () => {
        const element = renderer.createSVGElement(polygonShape);
        polygonShape.element = element;

        renderer.applyStyle(polygonShape);

        expect(element.getAttribute('fill')).toBe('rgb(255, 0, 0)');
        expect(element.getAttribute('stroke')).toBe('rgb(255, 0, 0)');
      });

      it('should apply opacity', () => {
        const element = renderer.createSVGElement(polygonShape);
        polygonShape.element = element;

        renderer.applyStyle(polygonShape);

        expect(element.getAttribute('fill-opacity')).toBe('0.5');
      });

      it('should apply stroke width', () => {
        const element = renderer.createSVGElement(polygonShape);
        polygonShape.element = element;

        renderer.applyStyle(polygonShape);

        expect(element.getAttribute('stroke-width')).toBe('2');
      });

      it('should use default stroke width if not provided', () => {
        const element = renderer.createSVGElement(polygonShape);
        polygonShape.element = element;
        polygonShape.style.strokeWidth = undefined;

        renderer.applyStyle(polygonShape);

        expect(element.getAttribute('stroke-width')).toBe('2');
      });

      it('should apply non-scaling-stroke vector effect', () => {
        const element = renderer.createSVGElement(polygonShape);
        polygonShape.element = element;

        renderer.applyStyle(polygonShape);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((element as any).style.vectorEffect).toBe('non-scaling-stroke');
      });

      it('should apply CSS class', () => {
        const element = renderer.createSVGElement(polygonShape);
        polygonShape.element = element;

        renderer.applyStyle(polygonShape);

        expect(element.getAttribute('class')).toBe('stroke-2');
      });

      it('should update name element color if present', () => {
        const element = renderer.createSVGElement(polygonShape);
        const nameElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        polygonShape.element = element;
        polygonShape.nameElement = nameElement;

        renderer.applyStyle(polygonShape);

        expect(nameElement.getAttribute('fill')).toBe('rgb(255, 0, 0)');
      });

      it('should not throw if element is undefined', () => {
        polygonShape.element = undefined;

        expect(() => renderer.applyStyle(polygonShape)).not.toThrow();
      });
    });
  });

  describe('CircleRenderer', () => {
    let renderer: CircleRenderer;
    let circleShape: CircleShape;

    beforeEach(() => {
      renderer = new CircleRenderer();
      circleShape = {
        id: 'test-circle',
        type: 'circle',
        name: 'Test Circle',
        center: { x: 50, y: 50 },
        radius: 25,
        points: [
          { x: 50, y: 50 },
          { x: 75, y: 50 },
        ],
        style: {
          color: { r: 0, g: 255, b: 0 },
          opacity: 0.7,
          strokeWidth: 3,
        },
        pointElements: [],
      };
    });

    describe('createSVGElement', () => {
      it('should create SVG circle element', () => {
        const element = renderer.createSVGElement(circleShape);

        // Check element type by tagName since SVGCircleElement may not be available in jsdom
        expect(element.tagName).toBe('circle');
        expect(element.namespaceURI).toBe('http://www.w3.org/2000/svg');
      });
    });

    describe('updatePoints', () => {
      it('should set cx, cy, and r attributes', () => {
        const element = renderer.createSVGElement(circleShape);
        circleShape.element = element;

        renderer.updatePoints(circleShape);

        expect(element.getAttribute('cx')).toBe('50');
        expect(element.getAttribute('cy')).toBe('50');
        expect(element.getAttribute('r')).toBe('25');
      });

      it('should update when center or radius changes', () => {
        const element = renderer.createSVGElement(circleShape);
        circleShape.element = element;
        circleShape.center = { x: 100, y: 100 };
        circleShape.radius = 50;

        renderer.updatePoints(circleShape);

        expect(element.getAttribute('cx')).toBe('100');
        expect(element.getAttribute('cy')).toBe('100');
        expect(element.getAttribute('r')).toBe('50');
      });

      it('should not throw if element is undefined', () => {
        circleShape.element = undefined;

        expect(() => renderer.updatePoints(circleShape)).not.toThrow();
      });
    });

    describe('applyStyle', () => {
      it('should apply color to fill and stroke', () => {
        const element = renderer.createSVGElement(circleShape);
        circleShape.element = element;

        renderer.applyStyle(circleShape);

        expect(element.getAttribute('fill')).toBe('rgb(0, 255, 0)');
        expect(element.getAttribute('stroke')).toBe('rgb(0, 255, 0)');
      });

      it('should apply opacity', () => {
        const element = renderer.createSVGElement(circleShape);
        circleShape.element = element;

        renderer.applyStyle(circleShape);

        expect(element.getAttribute('fill-opacity')).toBe('0.7');
      });

      it('should apply stroke width', () => {
        const element = renderer.createSVGElement(circleShape);
        circleShape.element = element;

        renderer.applyStyle(circleShape);

        expect(element.getAttribute('stroke-width')).toBe('3');
      });

      it('should apply non-scaling-stroke vector effect', () => {
        const element = renderer.createSVGElement(circleShape);
        circleShape.element = element;

        renderer.applyStyle(circleShape);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((element as any).style.vectorEffect).toBe('non-scaling-stroke');
      });

      it('should update name element color if present', () => {
        const element = renderer.createSVGElement(circleShape);
        const nameElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        circleShape.element = element;
        circleShape.nameElement = nameElement;

        renderer.applyStyle(circleShape);

        expect(nameElement.getAttribute('fill')).toBe('rgb(0, 255, 0)');
      });
    });
  });

  describe('ShapeRendererFactory', () => {
    it('should return PolygonRenderer for polygon type', () => {
      const renderer = ShapeRendererFactory.getRenderer('polygon');

      expect(renderer).toBeInstanceOf(PolygonRenderer);
    });

    it('should return CircleRenderer for circle type', () => {
      const renderer = ShapeRendererFactory.getRenderer('circle');

      expect(renderer).toBeInstanceOf(CircleRenderer);
    });

    it('should throw error for unknown shape type', () => {
      expect(() => ShapeRendererFactory.getRenderer('unknown')).toThrow(
        'No renderer found for shape type: unknown'
      );
    });

    it('should return same renderer instance on multiple calls', () => {
      const renderer1 = ShapeRendererFactory.getRenderer('polygon');
      const renderer2 = ShapeRendererFactory.getRenderer('polygon');

      expect(renderer1).toBe(renderer2);
    });

    it('should allow registering custom renderer', () => {
      const customRenderer = new PolygonRenderer();
      ShapeRendererFactory.registerRenderer('custom', customRenderer);

      const renderer = ShapeRendererFactory.getRenderer('custom');

      expect(renderer).toBe(customRenderer);
    });
  });

  describe('createShapeSVG', () => {
    it('should create SVG container with shape element', () => {
      const shape: PolygonShape = {
        id: 'svg-test',
        type: 'polygon',
        name: 'SVG Test',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 100 },
        ],
        style: {
          color: { r: 128, g: 128, b: 128 },
          opacity: 0.5,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      const svg = createShapeSVG(shape);

      expect(svg.tagName).toBe('svg');
      expect(svg.children.length).toBe(2); // shape + name
    });

    it('should create and attach name element', () => {
      const shape: PolygonShape = {
        id: 'name-test',
        type: 'polygon',
        name: 'Test Shape',
        points: [{ x: 10, y: 20 }],
        style: {
          color: { r: 255, g: 255, b: 255 },
          opacity: 1,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      const svg = createShapeSVG(shape);
      const nameElement = svg.querySelector('text');

      expect(nameElement).toBeTruthy();
      expect(nameElement?.textContent).toBe('Test Shape');
      expect(nameElement?.getAttribute('x')).toBe('10');
      expect(nameElement?.getAttribute('y')).toBe('5'); // 20 - 15
    });

    it('should position name above first point', () => {
      const shape: PolygonShape = {
        id: 'position-test',
        type: 'polygon',
        name: 'Position Test',
        points: [{ x: 50, y: 100 }],
        style: {
          color: { r: 0, g: 0, b: 0 },
          opacity: 0.5,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      const svg = createShapeSVG(shape);
      const nameElement = svg.querySelector('text');

      expect(nameElement?.getAttribute('y')).toBe('85'); // 100 - 15
    });

    it('should store element references on shape', () => {
      const shape: PolygonShape = {
        id: 'ref-test',
        type: 'polygon',
        name: 'Ref Test',
        points: [{ x: 0, y: 0 }],
        style: {
          color: { r: 0, g: 0, b: 0 },
          opacity: 0.5,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      createShapeSVG(shape);

      expect(shape.element).toBeDefined();
      expect(shape.svg).toBeDefined();
      expect(shape.nameElement).toBeDefined();
    });

    it('should apply initial style and points', () => {
      const shape: PolygonShape = {
        id: 'initial-test',
        type: 'polygon',
        name: 'Initial Test',
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        style: {
          color: { r: 100, g: 150, b: 200 },
          opacity: 0.8,
          strokeWidth: 4,
        },
        pointElements: [],
      };

      createShapeSVG(shape);

      expect(shape.element?.getAttribute('points')).toBe('0,0 10,10');
      expect(shape.element?.getAttribute('fill')).toBe('rgb(100, 150, 200)');
      expect(shape.element?.getAttribute('fill-opacity')).toBe('0.8');
    });

    it('should work with circle shapes', () => {
      const shape: CircleShape = {
        id: 'circle-svg-test',
        type: 'circle',
        name: 'Circle SVG',
        center: { x: 50, y: 50 },
        radius: 25,
        points: [
          { x: 50, y: 50 },
          { x: 75, y: 50 },
        ],
        style: {
          color: { r: 255, g: 0, b: 255 },
          opacity: 0.6,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      const svg = createShapeSVG(shape);
      const circleElement = svg.querySelector('circle');

      expect(circleElement).toBeTruthy();
      expect(circleElement?.getAttribute('cx')).toBe('50');
      expect(circleElement?.getAttribute('cy')).toBe('50');
      expect(circleElement?.getAttribute('r')).toBe('25');
    });
  });

  describe('updateShapeDisplay', () => {
    it('should update points and style', () => {
      const shape: PolygonShape = {
        id: 'update-test',
        type: 'polygon',
        name: 'Update Test',
        points: [{ x: 0, y: 0 }],
        style: {
          color: { r: 255, g: 0, b: 0 },
          opacity: 0.5,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      createShapeSVG(shape);

      // Change shape
      shape.points = [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ];
      shape.style.color = { r: 0, g: 255, b: 0 };

      updateShapeDisplay(shape);

      expect(shape.element?.getAttribute('points')).toBe('10,20 30,40');
      expect(shape.element?.getAttribute('fill')).toBe('rgb(0, 255, 0)');
    });

    it('should update point element positions', () => {
      const shape: PolygonShape = {
        id: 'point-update',
        type: 'polygon',
        name: 'Point Update',
        points: [
          { x: 10, y: 20 },
          { x: 30, y: 40 },
        ],
        style: {
          color: { r: 0, g: 0, b: 0 },
          opacity: 0.5,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      // Create point elements
      const pointEl1 = document.createElement('div');
      const pointEl2 = document.createElement('div');
      shape.pointElements = [pointEl1, pointEl2];

      createShapeSVG(shape);
      updateShapeDisplay(shape);

      expect(pointEl1.style.left).toBe('10px');
      expect(pointEl1.style.top).toBe('20px');
      expect(pointEl2.style.left).toBe('30px');
      expect(pointEl2.style.top).toBe('40px');
    });

    it('should update name position and content', () => {
      const shape: PolygonShape = {
        id: 'name-update',
        type: 'polygon',
        name: 'Old Name',
        points: [{ x: 50, y: 50 }],
        style: {
          color: { r: 0, g: 0, b: 0 },
          opacity: 0.5,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      createShapeSVG(shape);

      shape.name = 'New Name';
      shape.points = [{ x: 100, y: 100 }];

      updateShapeDisplay(shape);

      expect(shape.nameElement?.textContent).toBe('New Name');
      expect(shape.nameElement?.getAttribute('x')).toBe('100');
      expect(shape.nameElement?.getAttribute('y')).toBe('85'); // 100 - 15
    });

    it('should handle shapes without point elements', () => {
      const shape: PolygonShape = {
        id: 'no-points',
        type: 'polygon',
        name: 'No Points',
        points: [{ x: 10, y: 10 }],
        style: {
          color: { r: 0, g: 0, b: 0 },
          opacity: 0.5,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      createShapeSVG(shape);

      expect(() => updateShapeDisplay(shape)).not.toThrow();
    });

    it('should work with circle shapes', () => {
      const shape: CircleShape = {
        id: 'circle-update',
        type: 'circle',
        name: 'Circle Update',
        center: { x: 50, y: 50 },
        radius: 25,
        points: [
          { x: 50, y: 50 },
          { x: 75, y: 50 },
        ],
        style: {
          color: { r: 128, g: 128, b: 128 },
          opacity: 0.5,
          strokeWidth: 2,
        },
        pointElements: [],
      };

      createShapeSVG(shape);

      shape.center = { x: 100, y: 100 };
      shape.radius = 50;

      updateShapeDisplay(shape);

      expect(shape.element?.getAttribute('cx')).toBe('100');
      expect(shape.element?.getAttribute('cy')).toBe('100');
      expect(shape.element?.getAttribute('r')).toBe('50');
    });
  });
});

