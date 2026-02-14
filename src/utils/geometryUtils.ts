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

const perpendicularDistance = (
  point: Point,
  lineStart: Point,
  lineEnd: Point
): number => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    );
  }

  const area = Math.abs(
    dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
  );
  return area / Math.sqrt(lengthSq);
};

const rdpSimplify = (
  points: Point[],
  startIndex: number,
  endIndex: number,
  tolerance: number,
  keepIndices: Set<number>
): void => {
  if (endIndex <= startIndex + 1) return;

  let maxDist = 0;
  let maxIndex = startIndex;

  for (let i = startIndex + 1; i < endIndex; i++) {
    const dist = perpendicularDistance(
      points[i],
      points[startIndex],
      points[endIndex]
    );
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > tolerance) {
    keepIndices.add(maxIndex);
    rdpSimplify(points, startIndex, maxIndex, tolerance, keepIndices);
    rdpSimplify(points, maxIndex, endIndex, tolerance, keepIndices);
  }
};

export interface SimplificationResult {
  points: Point[];
  originalCount: number;
  simplifiedCount: number;
  keptIndices: number[];
}

export const simplifyPolygon = (
  points: Point[],
  tolerance: number
): SimplificationResult => {
  const originalCount = points.length;

  if (points.length <= 3) {
    return {
      points: [...points],
      originalCount,
      simplifiedCount: points.length,
      keptIndices: points.map((_, i) => i),
    };
  }

  if (tolerance <= 0) {
    return {
      points: [...points],
      originalCount,
      simplifiedCount: points.length,
      keptIndices: points.map((_, i) => i),
    };
  }

  const keepIndices = new Set<number>();
  keepIndices.add(0);
  keepIndices.add(points.length - 1);

  rdpSimplify(points, 0, points.length - 1, tolerance, keepIndices);

  let sortedIndices = Array.from(keepIndices).sort((a, b) => a - b);

  if (sortedIndices.length < 3) {
    let maxDist = 0;
    let maxIndex = -1;

    for (let i = 1; i < points.length - 1; i++) {
      if (keepIndices.has(i)) continue;

      let minDistToKept = Infinity;
      for (const keptIdx of sortedIndices) {
        const dx = points[i].x - points[keptIdx].x;
        const dy = points[i].y - points[keptIdx].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        minDistToKept = Math.min(minDistToKept, dist);
      }

      if (minDistToKept > maxDist) {
        maxDist = minDistToKept;
        maxIndex = i;
      }
    }

    if (maxIndex !== -1) {
      keepIndices.add(maxIndex);
      sortedIndices = Array.from(keepIndices).sort((a, b) => a - b);
    }
  }

  const simplifiedPoints = sortedIndices.map(i => ({ ...points[i] }));

  return {
    points: simplifiedPoints,
    originalCount,
    simplifiedCount: simplifiedPoints.length,
    keptIndices: sortedIndices,
  };
};

export const previewSimplification = (
  points: Point[],
  tolerance: number
): { kept: Point[]; removed: Point[]; keptIndices: number[]; removedIndices: number[] } => {
  const result = simplifyPolygon(points, tolerance);
  const keptSet = new Set(result.keptIndices);

  const kept: Point[] = [];
  const removed: Point[] = [];
  const removedIndices: number[] = [];

  points.forEach((point, index) => {
    if (keptSet.has(index)) {
      kept.push(point);
    } else {
      removed.push(point);
      removedIndices.push(index);
    }
  });

  return {
    kept,
    removed,
    keptIndices: result.keptIndices,
    removedIndices,
  };
};
