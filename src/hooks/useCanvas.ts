import { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasState, ImageInfo } from '../types';
import { updateCanvasTransform, resetCanvasView, calculateZoomedPosition } from '../utils';

export interface UseCanvasReturn {
  canvasState: CanvasState;
  canvasContainerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLDivElement>;
  imageInfo: ImageInfo;
  
  // Actions
  setScale: (scale: number) => void;
  setOffset: (offsetX: number, offsetY: number) => void;
  setDragging: (isDragging: boolean, dragStartX?: number, dragStartY?: number) => void;
  setMouseOverCanvas: (isOver: boolean) => void;
  uploadImage: (file: File) => void;
  resetView: () => void;
  zoom: (factor: number) => void;
  handleWheel: (e: WheelEvent) => void;
}

export const useCanvas = (): UseCanvasReturn => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    isMouseOverCanvas: false
  });

  const [imageInfo, setImageInfo] = useState<ImageInfo>({
    element: null,
    fileName: 'No file selected',
    naturalWidth: 1,
    naturalHeight: 1
  });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Update canvas transform when state changes
  useEffect(() => {
    updateCanvasTransform(canvasRef, canvasState.offsetX, canvasState.offsetY, canvasState.scale);
  }, [canvasState.offsetX, canvasState.offsetY, canvasState.scale]);

  const setScale = useCallback((scale: number) => {
    setCanvasState(prev => ({ ...prev, scale: Math.max(0.1, Math.min(scale, 10)) }));
  }, []);

  const setOffset = useCallback((offsetX: number, offsetY: number) => {
    setCanvasState(prev => ({ ...prev, offsetX, offsetY }));
  }, []);

  const setDragging = useCallback((isDragging: boolean, dragStartX = 0, dragStartY = 0) => {
    setCanvasState(prev => ({ ...prev, isDragging, dragStartX, dragStartY }));
  }, []);

  const setMouseOverCanvas = useCallback((isMouseOverCanvas: boolean) => {
    setCanvasState(prev => ({ ...prev, isMouseOverCanvas }));
  }, []);

  const uploadImage = useCallback((file: File) => {
    setImageInfo(prev => ({ ...prev, fileName: file.name }));

    const reader = new FileReader();
    reader.onload = (event) => {
      // Remove previous image
      if (imageInfo.element && canvasRef.current) {
        canvasRef.current.removeChild(imageInfo.element);
      }

      const img = new Image();
      img.src = event.target?.result as string;
      img.className = 'max-w-none';
      
      img.onload = () => {
        const newImageInfo: ImageInfo = {
          element: img,
          fileName: file.name,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        };
        setImageInfo(newImageInfo);
        
        // Reset view to fit new image
        const { scale, offsetX, offsetY } = resetCanvasView(newImageInfo, canvasContainerRef);
        setCanvasState(prev => ({ ...prev, scale, offsetX, offsetY }));
      };

      if (canvasRef.current) {
        canvasRef.current.appendChild(img);
      }
    };
    reader.readAsDataURL(file);
  }, [imageInfo.element]);

  const resetView = useCallback(() => {
    const { scale, offsetX, offsetY } = resetCanvasView(imageInfo, canvasContainerRef);
    setCanvasState(prev => ({ ...prev, scale, offsetX, offsetY }));
  }, [imageInfo]);

  const zoom = useCallback((factor: number) => {
    setCanvasState(prev => ({ 
      ...prev, 
      scale: Math.max(0.1, Math.min(prev.scale * factor, 10)) 
    }));
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    // Only zoom if mouse is over canvas
    if (!canvasState.isMouseOverCanvas) return;

    e.preventDefault();

    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = -Math.sign(e.deltaY);
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    
    const { newScale, newOffsetX, newOffsetY } = calculateZoomedPosition(
      mouseX, 
      mouseY, 
      canvasState.offsetX, 
      canvasState.offsetY, 
      canvasState.scale, 
      zoomFactor
    );

    setCanvasState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  }, [canvasState.isMouseOverCanvas, canvasState.offsetX, canvasState.offsetY, canvasState.scale]);

  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return {
    canvasState,
    canvasContainerRef,
    canvasRef,
    imageInfo,
    setScale,
    setOffset,
    setDragging,
    setMouseOverCanvas,
    uploadImage,
    resetView,
    zoom,
    handleWheel
  };
};
