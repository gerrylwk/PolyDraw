import { Shape, Point, PolygonShape, CircleShape, ShapeType, ShapeStyle, DraggedPoint } from '../types';

export const createShapeId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const getDefaultShapeStyle = (): ShapeStyle => ({
  color: { r: 59, g: 130, b: 246 }, // Default blue color
  opacity: 0.2,
  strokeWidth: 2
});

export const createPolygonShape = (
  firstPoint: Point,
  name: string,
  style?: Partial<ShapeStyle>
): PolygonShape => ({
  id: createShapeId(),
  type: 'polygon',
  name,
  points: [firstPoint],
  style: { ...getDefaultShapeStyle(), ...style },
  pointElements: [],
  element: undefined,
  svg: undefined,
  nameElement: undefined,
  previewLine: undefined
});

export const createCircleShape = (
  center: Point,
  radius: number,
  name: string,
  style?: Partial<ShapeStyle>
): CircleShape => ({
  id: createShapeId(),
  type: 'circle',
  name,
  center,
  radius,
  points: [center], // For consistency with base interface
  style: { ...getDefaultShapeStyle(), ...style },
  pointElements: [],
  element: undefined,
  svg: undefined,
  nameElement: undefined
});

export const findPointAt = (
  x: number,
  y: number,
  shapes: Shape[],
  scale: number
): DraggedPoint | null => {
  const threshold = 15 / scale;

  for (const shape of shapes) {
    for (let i = 0; i < shape.points.length; i++) {
      const point = shape.points[i];
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));

      if (distance <= threshold) {
        return {
          x: point.x,
          y: point.y,
          index: i,
          shape: shape
        };
      }
    }
  }

  return null;
};

export const updateShapePoints = (
  shape: Shape,
  newPoints: Point[]
): Shape => {
  return {
    ...shape,
    points: newPoints
  };
};

export const isShapeComplete = (shape: Shape): boolean => {
  switch (shape.type) {
    case 'polygon':
      return shape.points.length >= 3;
    case 'circle':
      return shape.points.length >= 1;
    case 'rectangle':
      return shape.points.length >= 2;
    case 'line':
      return shape.points.length >= 2;
    default:
      return false;
  }
};

export const getShapeDisplayName = (shapeType: ShapeType): string => {
  const displayNames: Record<ShapeType, string> = {
    polygon: 'Polygon',
    circle: 'Circle',
    rectangle: 'Rectangle',
    line: 'Line',
    ellipse: 'Ellipse'
  };
  return displayNames[shapeType];
};

export const calculateShapeBounds = (shape: Shape): { 
  minX: number; 
  minY: number; 
  maxX: number; 
  maxY: number; 
} => {
  if (shape.points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = shape.points[0].x;
  let minY = shape.points[0].y;
  let maxX = shape.points[0].x;
  let maxY = shape.points[0].y;

  for (const point of shape.points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, minY, maxX, maxY };
};
