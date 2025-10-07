import { Shape, PolygonShape, CircleShape } from '../types';

export interface ShapeRenderer {
  createSVGElement(shape: Shape): SVGElement;
  updatePoints(shape: Shape): void;
  applyStyle(shape: Shape): void;
}

export class PolygonRenderer implements ShapeRenderer {
  createSVGElement(): SVGPolygonElement {
    const polygonElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    return polygonElement;
  }

  updatePoints(shape: PolygonShape): void {
    if (!shape.element) return;
    
    const pointsStr = shape.points.map(p => `${p.x},${p.y}`).join(' ');
    shape.element.setAttribute('points', pointsStr);
  }

  applyStyle(shape: PolygonShape): void {
    if (!shape.element) return;

    const { r, g, b } = shape.style.color;
    const colorString = `rgb(${r}, ${g}, ${b})`;

    shape.element.setAttribute('fill', colorString);
    shape.element.setAttribute('stroke', colorString);
    shape.element.setAttribute('fill-opacity', shape.style.opacity.toString());
    shape.element.setAttribute('stroke-width', (shape.style.strokeWidth || 2).toString());
    shape.element.setAttribute('class', 'stroke-2');
    (shape.element as SVGPolygonElement).style.vectorEffect = 'non-scaling-stroke';

    // Update name element color to match shape
    if (shape.nameElement) {
      shape.nameElement.setAttribute('fill', colorString);
    }
  }
}

export class CircleRenderer implements ShapeRenderer {
  createSVGElement(): SVGCircleElement {
    const circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    return circleElement;
  }

  updatePoints(shape: CircleShape): void {
    if (!shape.element) return;
    
    shape.element.setAttribute('cx', shape.center.x.toString());
    shape.element.setAttribute('cy', shape.center.y.toString());
    shape.element.setAttribute('r', shape.radius.toString());
  }

  applyStyle(shape: CircleShape): void {
    if (!shape.element) return;

    const { r, g, b } = shape.style.color;
    const colorString = `rgb(${r}, ${g}, ${b})`;

    shape.element.setAttribute('fill', colorString);
    shape.element.setAttribute('stroke', colorString);
    shape.element.setAttribute('fill-opacity', shape.style.opacity.toString());
    shape.element.setAttribute('stroke-width', (shape.style.strokeWidth || 2).toString());
    (shape.element as SVGCircleElement).style.vectorEffect = 'non-scaling-stroke';

    // Update name element color to match shape
    if (shape.nameElement) {
      shape.nameElement.setAttribute('fill', colorString);
    }
  }
}

export class ShapeRendererFactory {
  private static renderers = new Map<string, ShapeRenderer>([
    ['polygon', new PolygonRenderer()],
    ['circle', new CircleRenderer()]
  ]);

  static getRenderer(shapeType: string): ShapeRenderer {
    const renderer = this.renderers.get(shapeType);
    if (!renderer) {
      throw new Error(`No renderer found for shape type: ${shapeType}`);
    }
    return renderer;
  }

  static registerRenderer(shapeType: string, renderer: ShapeRenderer): void {
    this.renderers.set(shapeType, renderer);
  }
}

export const createShapeSVG = (shape: Shape): SVGSVGElement => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute('class', 'absolute top-0 left-0 w-full h-full pointer-events-none');
  svg.style.transformOrigin = '0 0';

  const renderer = ShapeRendererFactory.getRenderer(shape.type);
  const shapeElement = renderer.createSVGElement(shape);
  
  // Create name element
  const nameElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
  nameElement.setAttribute('class', 'shape-name');
  nameElement.setAttribute('font-size', '12');
  nameElement.setAttribute('font-weight', 'bold');
  
  if (shape.points.length > 0) {
    const firstPoint = shape.points[0];
    nameElement.setAttribute('x', firstPoint.x.toString());
    nameElement.setAttribute('y', (firstPoint.y - 15).toString());
  }
  nameElement.textContent = shape.name;

  svg.appendChild(shapeElement);
  svg.appendChild(nameElement);

  // Store references
  shape.element = shapeElement;
  shape.svg = svg;
  shape.nameElement = nameElement;

  // Apply initial styling and update points
  renderer.applyStyle(shape);
  renderer.updatePoints(shape);

  return svg;
};

export const updateShapeDisplay = (shape: Shape): void => {
  const renderer = ShapeRendererFactory.getRenderer(shape.type);
  renderer.updatePoints(shape);
  renderer.applyStyle(shape);

  // Update point elements positions
  shape.points.forEach((point, index) => {
    if (shape.pointElements[index]) {
      shape.pointElements[index].style.left = `${point.x}px`;
      shape.pointElements[index].style.top = `${point.y}px`;
    }
  });

  // Update name position
  if (shape.nameElement && shape.points.length > 0) {
    const firstPoint = shape.points[0];
    shape.nameElement.setAttribute('x', firstPoint.x.toString());
    shape.nameElement.setAttribute('y', (firstPoint.y - 15).toString());
    shape.nameElement.textContent = shape.name;
  }
};
