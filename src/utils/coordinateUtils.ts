import { Point, ImageInfo, ViewType } from '../types';

export const getMousePosition = (
  e: React.MouseEvent,
  canvasContainerRef: React.RefObject<HTMLDivElement>,
  offsetX: number,
  offsetY: number,
  scale: number,
  snapToEdge: boolean,
  uploadedImage: ImageInfo,
  snapThreshold: number,
  viewType: ViewType
): Point => {
  const rect = canvasContainerRef.current?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };

  const rawPosition = {
    x: (e.clientX - rect.left - offsetX) / scale,
    y: (e.clientY - rect.top - offsetY) / scale
  };

  // Apply snapping if enabled and image is loaded
  if (snapToEdge && uploadedImage.element) {
    return snapToImageEdges(rawPosition, uploadedImage, snapThreshold, scale, viewType);
  }

  return rawPosition;
};

export const snapToImageEdges = (
  position: Point,
  imageInfo: ImageInfo,
  snapThreshold: number,
  scale: number,
  viewType: ViewType
): Point => {
  if (!imageInfo.element) return position;

  const imgWidth = imageInfo.naturalWidth;
  const imgHeight = imageInfo.naturalHeight;
  const threshold = snapThreshold / scale; // Adjust threshold based on zoom level

  let { x, y } = position;

  // Snap to left edge
  if (Math.abs(x - 0) <= threshold) {
    x = 0;
  }
  // Snap to right edge
  else if (Math.abs(x - imgWidth) <= threshold) {
    x = imgWidth;
  }

  // Handle vertical snapping based on view type
  if (viewType === 'static') {
    // Snap to top edge
    if (Math.abs(y - 0) <= threshold) {
      y = 0;
    }
    // Snap to bottom edge
    else if (Math.abs(y - imgHeight) <= threshold) {
      y = imgHeight;
    }
  } else if (viewType === 'double-panoramic') {
    const midPoint = imgHeight / 2;
    
    // Determine which half we're in
    if (y <= midPoint) {
      // Top half - snap to top edge or middle boundary
      if (Math.abs(y - 0) <= threshold) {
        y = 0;
      } else if (Math.abs(y - midPoint) <= threshold) {
        y = midPoint;
      }
      // Constrain to top half
      if (y > midPoint) {
        y = midPoint;
      }
    } else {
      // Bottom half - snap to middle boundary + 1 or bottom edge
      if (Math.abs(y - midPoint) <= threshold) {
        y = midPoint + 1;
      } else if (Math.abs(y - imgHeight) <= threshold) {
        y = imgHeight;
      }
      // Constrain to bottom half
      if (y < midPoint) {
        y = midPoint;
      }
    }
  }

  return { x, y };
};

export const straightenLine = (startPoint: Point, endPoint: Point): Point => {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  
  // Calculate angles for horizontal, vertical, and 45-degree lines
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Normalize angle to 0-360 range
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  // Define snap angles and their tolerances
  const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  const tolerance = 22.5; // 22.5 degrees tolerance for snapping
  
  // Find the closest snap angle
  let closestAngle = normalizedAngle;
  let minDifference = Infinity;
  
  for (const snapAngle of snapAngles) {
    const difference = Math.min(
      Math.abs(normalizedAngle - snapAngle),
      Math.abs(normalizedAngle - snapAngle + 360),
      Math.abs(normalizedAngle - snapAngle - 360)
    );
    
    if (difference < tolerance && difference < minDifference) {
      minDifference = difference;
      closestAngle = snapAngle;
    }
  }
  
  // Calculate the distance from start to end point
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Convert the closest angle back to radians and calculate new end point
  const radians = closestAngle * (Math.PI / 180);
  
  return {
    x: startPoint.x + Math.cos(radians) * distance,
    y: startPoint.y + Math.sin(radians) * distance
  };
};

export const normalizeCoordinates = (
  point: Point,
  imageInfo: ImageInfo
): Point => {
  if (!imageInfo.element) return point;
  
  return {
    x: point.x / imageInfo.naturalWidth,
    y: point.y / imageInfo.naturalHeight
  };
};

export const denormalizeCoordinates = (
  normalizedPoint: Point,
  imageInfo: ImageInfo
): Point => {
  if (!imageInfo.element) return normalizedPoint;
  
  return {
    x: normalizedPoint.x * imageInfo.naturalWidth,
    y: normalizedPoint.y * imageInfo.naturalHeight
  };
};
