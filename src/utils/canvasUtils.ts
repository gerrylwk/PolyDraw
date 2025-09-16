import { ImageInfo } from '../types';

export const resetCanvasView = (
  imageInfo: ImageInfo,
  canvasContainerRef: React.RefObject<HTMLDivElement>
): { scale: number; offsetX: number; offsetY: number } => {
  if (!imageInfo.element || !canvasContainerRef.current) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }

  const containerWidth = canvasContainerRef.current.clientWidth;
  const containerHeight = canvasContainerRef.current.clientHeight;
  const imgWidth = imageInfo.naturalWidth;
  const imgHeight = imageInfo.naturalHeight;

  const scaleX = containerWidth / imgWidth;
  const scaleY = containerHeight / imgHeight;
  const newScale = Math.min(scaleX, scaleY);

  return {
    scale: newScale,
    offsetX: (containerWidth - imgWidth * newScale) / 2,
    offsetY: (containerHeight - imgHeight * newScale) / 2
  };
};

export const calculateZoomedPosition = (
  mouseX: number,
  mouseY: number,
  offsetX: number,
  offsetY: number,
  scale: number,
  zoomFactor: number
): { newScale: number; newOffsetX: number; newOffsetY: number } => {
  const canvasX = (mouseX - offsetX) / scale;
  const canvasY = (mouseY - offsetY) / scale;
  
  const newScale = Math.max(0.1, Math.min(scale * zoomFactor, 10));
  
  return {
    newScale,
    newOffsetX: mouseX - canvasX * newScale,
    newOffsetY: mouseY - canvasY * newScale
  };
};

export const updateCanvasTransform = (
  canvasRef: React.RefObject<HTMLDivElement>,
  offsetX: number,
  offsetY: number,
  scale: number
): void => {
  if (canvasRef.current) {
    canvasRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  }
};
