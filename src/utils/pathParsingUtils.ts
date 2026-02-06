import { PathTestPoint, PathPointStatus, Shape } from '../types';

const STATUS_PREFIX_MAP: Record<string, PathPointStatus> = {
  '[IN]': 'inside',
  '[OUT]': 'outside',
  '[EDGE]': 'edge',
};

const STATUS_LABEL_MAP: Record<PathPointStatus, string> = {
  inside: '[IN]',
  outside: '[OUT]',
  edge: '[EDGE]',
};

export const parsePathFromText = (text: string): PathTestPoint[] => {
  const lines = text.split('\n');
  const points: PathTestPoint[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    let status: PathPointStatus = 'outside';
    let coordPart = trimmed;

    for (const [prefix, s] of Object.entries(STATUS_PREFIX_MAP)) {
      if (trimmed.startsWith(prefix)) {
        status = s;
        coordPart = trimmed.slice(prefix.length).trim();
        break;
      }
    }

    const match = coordPart.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (match) {
      points.push({
        x: parseFloat(match[1]),
        y: parseFloat(match[2]),
        index: points.length,
        status,
        containingPolygons: [],
        validFormat: true,
      });
    } else {
      points.push({
        x: 0,
        y: 0,
        index: points.length,
        status: 'outside',
        containingPolygons: [],
        validFormat: false,
      });
    }
  }

  return points;
};

export const formatPathToText = (points: PathTestPoint[]): string => {
  return points
    .map(p => `${Math.round(p.x)}, ${Math.round(p.y)}`)
    .join('\n');
};

export const exportPathToJSON = (
  points: PathTestPoint[],
  shapes: Shape[]
): string => {
  const shapeMap = new Map(shapes.map(s => [s.id, s.name]));
  const data = {
    timestamp: new Date().toISOString(),
    totalPoints: points.length,
    inside: points.filter(p => p.status === 'inside').length,
    outside: points.filter(p => p.status === 'outside').length,
    edge: points.filter(p => p.status === 'edge').length,
    points: points.map(p => ({
      x: Math.round(p.x),
      y: Math.round(p.y),
      status: p.status,
      containingPolygons: p.containingPolygons.map(id => shapeMap.get(id) || id),
    })),
  };
  return JSON.stringify(data, null, 2);
};

export const exportPathToCSV = (
  points: PathTestPoint[],
  shapes: Shape[]
): string => {
  const shapeMap = new Map(shapes.map(s => [s.id, s.name]));
  const header = 'Point,X,Y,Status,Containing Polygons';
  const rows = points.map(p => {
    const polygonNames = p.containingPolygons
      .map(id => shapeMap.get(id) || id)
      .join('; ');
    return `${p.index + 1},${Math.round(p.x)},${Math.round(p.y)},${p.status},"${polygonNames}"`;
  });
  return [header, ...rows].join('\n');
};
