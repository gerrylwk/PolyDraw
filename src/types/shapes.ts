export interface Point {
  x: number;
  y: number;
}

export interface ShapeStyle {
  color: { r: number; g: number; b: number };
  opacity: number;
  strokeWidth?: number;
}

export type ShapeType = 'polygon' | 'circle' | 'rectangle' | 'line' | 'ellipse';

export interface BaseShape {
  id: string;
  type: ShapeType;
  name: string;
  style: ShapeStyle;
  points: Point[];
  // SVG elements for rendering
  element?: SVGElement;
  svg?: SVGSVGElement;
  nameElement?: SVGTextElement;
  pointElements: HTMLDivElement[];
}

export interface PolygonShape extends BaseShape {
  type: 'polygon';
  previewLine?: SVGLineElement;
}

export interface CircleShape extends BaseShape {
  type: 'circle';
  center: Point;
  radius: number;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  width: number;
  height: number;
}

export interface LineShape extends BaseShape {
  type: 'line';
  startPoint: Point;
  endPoint: Point;
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse';
  center: Point;
  radiusX: number;
  radiusY: number;
}

export type Shape = PolygonShape | CircleShape | RectangleShape | LineShape | EllipseShape;

export interface DraggedPoint {
  x: number;
  y: number;
  index: number;
  shape: Shape;
}
