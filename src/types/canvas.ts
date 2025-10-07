export type ViewType = 'static' | 'double-panoramic';

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  isMouseOverCanvas: boolean;
}

export interface CanvasSettings {
  snapToEdge: boolean;
  snapThreshold: number;
  normalize: boolean;
  viewType: ViewType;
}

export interface ImageInfo {
  element: HTMLImageElement | null;
  fileName: string;
  naturalWidth: number;
  naturalHeight: number;
  originalWidth?: number;
  originalHeight?: number;
  wasResized?: boolean;
  isLoading?: boolean;
  loadProgress?: number;
}
