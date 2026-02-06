import { Point, Shape, PathPointStatus } from '../types';
import { calculateShapeBounds } from './shapeUtils';

const EDGE_THRESHOLD = 3;

export const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

export const pointToSegmentDistance = (
  point: Point,
  segStart: Point,
  segEnd: Point
): number => {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt(
      (point.x - segStart.x) ** 2 + (point.y - segStart.y) ** 2
    );
  }

  let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = segStart.x + t * dx;
  const projY = segStart.y + t * dy;

  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
};

export const isPointOnEdge = (point: Point, polygon: Point[]): boolean => {
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dist = pointToSegmentDistance(point, polygon[i], polygon[j]);
    if (dist <= EDGE_THRESHOLD) return true;
  }

  return false;
};

export const checkPointContainment = (
  point: Point,
  shapes: Shape[]
): { status: PathPointStatus; containingPolygons: string[] } => {
  const containingPolygons: string[] = [];

  for (const shape of shapes) {
    if (shape.type !== 'polygon' || shape.points.length < 3) continue;

    const bounds = calculateShapeBounds(shape);
    if (
      point.x < bounds.minX - EDGE_THRESHOLD ||
      point.x > bounds.maxX + EDGE_THRESHOLD ||
      point.y < bounds.minY - EDGE_THRESHOLD ||
      point.y > bounds.maxY + EDGE_THRESHOLD
    ) {
      continue;
    }

    if (isPointOnEdge(point, shape.points)) {
      containingPolygons.push(shape.id);
      continue;
    }

    if (isPointInPolygon(point, shape.points)) {
      containingPolygons.push(shape.id);
    }
  }

  if (containingPolygons.length === 0) return { status: 'outside', containingPolygons };

  for (const shapeId of containingPolygons) {
    const shape = shapes.find(s => s.id === shapeId);
    if (shape && isPointOnEdge(point, shape.points)) {
      return { status: 'edge', containingPolygons };
    }
  }

  return { status: 'inside', containingPolygons };
};

export const runContainmentChecks = (
  path: Point[],
  shapes: Shape[]
): { status: PathPointStatus; containingPolygons: string[] }[] => {
  return path.map(point => checkPointContainment(point, shapes));
};
