import { Point, CircleShape } from '../types';
import { createShapeId, getDefaultShapeStyle } from './shapeUtils';

export const createCircleFromPoints = (
  center: Point,
  edgePoint: Point,
  name: string
): CircleShape => {
  const radius = Math.sqrt(
    Math.pow(edgePoint.x - center.x, 2) + Math.pow(edgePoint.y - center.y, 2)
  );

  return {
    id: createShapeId(),
    type: 'circle',
    name,
    center,
    radius,
    points: [center, edgePoint], // Store center and edge point for consistency
    style: getDefaultShapeStyle(),
    pointElements: [],
    element: undefined,
    svg: undefined,
    nameElement: undefined
  };
};

export const updateCircleFromPoints = (
  circle: CircleShape,
  newCenter: Point,
  newEdgePoint: Point
): CircleShape => {
  const newRadius = Math.sqrt(
    Math.pow(newEdgePoint.x - newCenter.x, 2) + Math.pow(newEdgePoint.y - newCenter.y, 2)
  );

  return {
    ...circle,
    center: newCenter,
    radius: newRadius,
    points: [newCenter, newEdgePoint]
  };
};

export const getCirclePointsForSVG = (circle: CircleShape): string => {
  // For export purposes, approximate circle as polygon with many points
  const numPoints = 32;
  const points: Point[] = [];
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    const x = circle.center.x + circle.radius * Math.cos(angle);
    const y = circle.center.y + circle.radius * Math.sin(angle);
    points.push({ x, y });
  }
  
  return points.map(p => `${p.x},${p.y}`).join(' ');
};
