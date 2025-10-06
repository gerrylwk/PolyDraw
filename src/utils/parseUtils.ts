import { Point, Shape, PolygonShape, ShapeStyle } from '../types';

// Polygon interface for backward compatibility with older data formats
interface LegacyPolygon {
  id: number;
  name: string;
  points: Point[];
  color: { r: number; g: number; b: number };
  element?: SVGPolygonElement;
  svg?: SVGSVGElement;
  previewLine?: SVGLineElement;
  pointElements: HTMLDivElement[];
  nameElement?: SVGTextElement;
}

// Interface for image information needed for coordinate normalization
interface ImageInfo {
  naturalWidth: number;
  naturalHeight: number;
}

/**
 * Converts a legacy polygon format to the current Shape system
 */
const convertLegacyPolygonToShape = (polygon: LegacyPolygon, opacity: number = 1): PolygonShape => {
  const style: ShapeStyle = {
    color: polygon.color,
    opacity: opacity,
    strokeWidth: 2
  };

  return {
    id: polygon.id.toString(),
    type: 'polygon',
    name: polygon.name,
    points: polygon.points,
    style,
    pointElements: polygon.pointElements,
    element: polygon.element,
    svg: polygon.svg,
    nameElement: polygon.nameElement,
    ...(polygon.previewLine && { previewLine: polygon.previewLine })
  };
};

/**
 * Converts a Shape to legacy polygon format for backward compatibility
 */
const convertShapeToLegacyPolygon = (shape: PolygonShape): LegacyPolygon => {
  return {
    id: parseInt(shape.id) || Date.now(),
    name: shape.name,
    points: shape.points,
    color: shape.style.color,
    pointElements: shape.pointElements,
    element: shape.element as SVGPolygonElement,
    svg: shape.svg,
    nameElement: shape.nameElement,
    ...(('previewLine' in shape) && { previewLine: shape.previewLine as SVGLineElement })
  };
};

/**
 * Generates an SVG coordinate string from shapes
 * @param shapes - Array of shapes to convert
 * @param normalize - Whether to normalize coordinates (0-1 range)  
 * @param imageInfo - Image dimensions for normalization
 * @returns SVG coordinate string
 */
export const generateSVGString = (
  shapes: Shape[],
  normalize: boolean = false,
  imageInfo?: ImageInfo
): string => {
  if (shapes.length === 0) return '# No polygons created yet';

  const imgWidth = imageInfo?.naturalWidth || 1;
  const imgHeight = imageInfo?.naturalHeight || 1;

  let svgString = '';
  shapes.forEach((shape) => {
    svgString += `# ${shape.name}\n`;
    
    const points = shape.points.map(point => {
      if (normalize && imageInfo) {
        return `${(point.x / imgWidth).toFixed(4)} ${(point.y / imgHeight).toFixed(4)}`;
      }
      return `${Math.round(point.x)} ${Math.round(point.y)}`;
    });

    svgString += points.join(' ');
    svgString += '\n\n';
  });

  return svgString;
};

/**
 * Generates an SVG coordinate string from legacy polygons (for backward compatibility)
 * @param polygons - Array of legacy polygons to convert
 * @param normalize - Whether to normalize coordinates (0-1 range)
 * @param imageInfo - Image dimensions for normalization
 * @returns SVG coordinate string
 */
export const generateSVGStringFromPolygons = (
  polygons: LegacyPolygon[],
  normalize: boolean = false,
  imageInfo?: ImageInfo
): string => {
  if (polygons.length === 0) return '# No polygons created yet';

  const imgWidth = imageInfo?.naturalWidth || 1;
  const imgHeight = imageInfo?.naturalHeight || 1;

  let svgString = '';
  polygons.forEach((polygon) => {
    svgString += `# ${polygon.name}\n`;
    
    const points = polygon.points.map(point => {
      if (normalize && imageInfo) {
        return `${(point.x / imgWidth).toFixed(4)} ${(point.y / imgHeight).toFixed(4)}`;
      }
      return `${Math.round(point.x)} ${Math.round(point.y)}`;
    });

    svgString += points.join(' ');
    svgString += '\n\n';
  });

  return svgString;
};

/**
 * Parses a Python coordinate string into shapes
 * @param pythonString - String containing Python list format coordinates
 * @param normalize - Whether coordinates are normalized and need denormalization
 * @param imageInfo - Image dimensions for denormalization
 * @param opacity - Opacity to apply to created shapes (defaults to 1)
 * @returns Array of parsed shapes
 */
export const parsePythonString = (
  pythonString: string,
  normalize: boolean = false,
  imageInfo?: ImageInfo,
  opacity: number = 1
): PolygonShape[] => {
  // Parse Python list format coordinates
  const lines = pythonString.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('#');
  });
  const newPolygons: LegacyPolygon[] = [];
  
  lines.forEach((line, index) => {
    // Match Python list format: [(x, y), (x, y), ...] or with assignment
    const listMatch = line.match(/(?:=\s*)?\[(.*)\]/);
    if (listMatch) {
      const coordsString = listMatch[1];
      // Extract coordinate pairs from the string
      const coordMatches = coordsString.match(/\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g);
      
      if (coordMatches && coordMatches.length >= 3) { // At least 3 points
        const points: Point[] = [];
        
        coordMatches.forEach(coordMatch => {
          const coordPair = coordMatch.match(/\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
          if (coordPair) {
            let x = parseFloat(coordPair[1]);
            let y = parseFloat(coordPair[2]);
            
            // If coordinates are normalized, convert back to pixel coordinates
            if (normalize && imageInfo) {
              x = x * imageInfo.naturalWidth;
              y = y * imageInfo.naturalHeight;
            }
            
            points.push({ x, y });
          }
        });
        
        if (points.length >= 3) {
          const newPolygon: LegacyPolygon = {
            id: Date.now() + Math.floor(Math.random() * 1000000) + index,
            name: `Polygon ${index + 1}`,
            points,
            color: { r: 59, g: 130, b: 246 }, // Default blue color
            pointElements: []
          };
          
          newPolygons.push(newPolygon);
        }
      }
    }
  });
  
  // Convert legacy polygons to new shapes
  return newPolygons.map(polygon => convertLegacyPolygonToShape(polygon, opacity));
};

/**
 * Parses an SVG coordinate string into shapes
 * @param svgString - String containing space-separated coordinates
 * @param normalize - Whether coordinates are normalized and need denormalization
 * @param imageInfo - Image dimensions for denormalization
 * @param opacity - Opacity to apply to created shapes (defaults to 1)
 * @returns Array of parsed shapes
 */
export const parseSVGString = (
  svgString: string,
  normalize: boolean = false,
  imageInfo?: ImageInfo,
  opacity: number = 1
): PolygonShape[] => {
  // Parse space-separated coordinate format
  const lines = svgString.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  const newPolygons: LegacyPolygon[] = [];
  
  lines.forEach((line, index) => {
    const coords = line.trim().split(/\s+/).map(coord => parseFloat(coord)).filter(num => !isNaN(num));
    
    if (coords.length >= 6 && coords.length % 2 === 0) { // At least 3 points (6 coordinates)
      const points: Point[] = [];
      for (let i = 0; i < coords.length; i += 2) {
        let x = coords[i];
        let y = coords[i + 1];
        
        // If coordinates are normalized, convert back to pixel coordinates
        if (normalize && imageInfo) {
          x = x * imageInfo.naturalWidth;
          y = y * imageInfo.naturalHeight;
        }
        
        points.push({ x, y });
      }
      
      const newPolygon: LegacyPolygon = {
        id: Date.now() + Math.floor(Math.random() * 1000000) + index,
        name: `Polygon ${index + 1}`,
        points,
        color: { r: 59, g: 130, b: 246 }, // Default blue color
        pointElements: []
      };
      
      newPolygons.push(newPolygon);
    }
  });
  
  // Convert legacy polygons to new shapes
  return newPolygons.map(polygon => convertLegacyPolygonToShape(polygon, opacity));
};

// ==== LEGACY COMPATIBILITY FUNCTIONS ====

/**
 * Parses a Python coordinate string into legacy polygons (for backward compatibility)
 * Uses the exact same logic as the main parsePythonString but returns legacy format
 */
export const parsePythonStringToPolygons = (
  pythonString: string,
  normalize: boolean = false,
  imageInfo?: ImageInfo
): LegacyPolygon[] => {
  // Call the main function and convert back to legacy format  
  const shapes = parsePythonString(pythonString, normalize, imageInfo, 1);
  return shapes.map(convertShapeToLegacyPolygon);
};

/**
 * Parses an SVG coordinate string into legacy polygons (for backward compatibility)
 * Uses the exact same logic as the main parseSVGString but returns legacy format
 */
export const parseSVGStringToPolygons = (
  svgString: string,
  normalize: boolean = false,
  imageInfo?: ImageInfo
): LegacyPolygon[] => {
  // Call the main function and convert back to legacy format
  const shapes = parseSVGString(svgString, normalize, imageInfo, 1);
  return shapes.map(convertShapeToLegacyPolygon);
};
