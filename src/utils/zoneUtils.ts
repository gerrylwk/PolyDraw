import { Shape, ZoneType, ZoneSchema, ZoneAnnotation, Point, PolygonShape } from '../types';
import { generateRandomName, generateUniqueId } from './nameGenerator';

export function pointsToSvgString(points: Point[]): string {
  return points.map(p => `${Math.round(p.x)} ${Math.round(p.y)}`).join(' ');
}

export function svgStringToPoints(svgString: string): Point[] {
  const numbers = svgString.trim().split(/\s+/).map(n => parseFloat(n));
  const points: Point[] = [];
  for (let i = 0; i < numbers.length - 1; i += 2) {
    if (!isNaN(numbers[i]) && !isNaN(numbers[i + 1])) {
      points.push({ x: numbers[i], y: numbers[i + 1] });
    }
  }
  return points;
}

export function shapesToZoneSchema(shapes: Shape[], zoneTypes: ZoneType[]): ZoneSchema {
  const zones: ZoneAnnotation[] = shapes.map(shape => ({
    name: shape.name || generateRandomName(),
    zone_type: shape.zoneType || 'region',
    points: pointsToSvgString(shape.points),
  }));

  const typeDefinitions = zoneTypes.map(type => ({
    id: type.id,
    name: type.name,
    color: type.color,
  }));

  return {
    zones,
    zone_types: typeDefinitions,
  };
}

export function generateZoneJSON(shapes: Shape[], zoneTypes: ZoneType[]): string {
  const schema = shapesToZoneSchema(shapes, zoneTypes);
  return JSON.stringify(schema, null, 2);
}

export interface ParsedZoneData {
  shapes: Omit<PolygonShape, 'svg' | 'element' | 'nameElement' | 'pointElements' | 'previewLine'>[];
  zoneTypes: ZoneType[];
}

export function parseZoneJSON(
  jsonString: string,
  currentOpacity: number = 0.2
): ParsedZoneData {
  const schema: ZoneSchema = JSON.parse(jsonString);

  if (!schema.zones || !Array.isArray(schema.zones)) {
    throw new Error('Invalid schema: missing zones array');
  }

  const zoneTypes: ZoneType[] = (schema.zone_types || []).map(type => ({
    id: type.id,
    name: type.name,
    color: type.color,
    isVisible: true,
  }));

  const colorMap = new Map(zoneTypes.map(t => [t.id, t.color]));

  const shapes = schema.zones.map((zone, index) => {
    const points = svgStringToPoints(zone.points);
    if (points.length < 3) {
      throw new Error(`Zone "${zone.name}" has fewer than 3 points`);
    }

    const zoneTypeId = zone.zone_type || 'region';
    const colorHex = colorMap.get(zoneTypeId) || '#3b82f6';
    const rgb = hexToRgb(colorHex);

    return {
      id: generateUniqueId(),
      type: 'polygon' as const,
      name: zone.name || `Zone ${index + 1}`,
      zoneType: zoneTypeId,
      points,
      style: {
        color: rgb,
        opacity: currentOpacity,
      },
      pointElements: [] as HTMLDivElement[],
    };
  });

  return { shapes, zoneTypes };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  return { r: 59, g: 130, b: 246 };
}

export function createDebouncedSerializer(
  delay: number = 250
): {
  schedule: (shapes: Shape[], zoneTypes: ZoneType[], callback: (json: string) => void) => void;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let idleCallbackId: number | null = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (idleCallbackId !== null && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleCallbackId);
      idleCallbackId = null;
    }
  };

  const schedule = (
    shapes: Shape[],
    zoneTypes: ZoneType[],
    callback: (json: string) => void
  ) => {
    cancel();

    timeoutId = setTimeout(() => {
      const runSerialization = () => {
        const json = generateZoneJSON(shapes, zoneTypes);
        callback(json);
      };

      if (typeof requestIdleCallback !== 'undefined') {
        idleCallbackId = requestIdleCallback(runSerialization, { timeout: 100 });
      } else {
        setTimeout(runSerialization, 0);
      }
    }, delay);
  };

  return { schedule, cancel };
}
