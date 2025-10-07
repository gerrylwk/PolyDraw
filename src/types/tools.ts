export type ToolType = 'select' | 'polygon' | 'circle' | 'rectangle' | 'line';

export interface ToolState {
  currentTool: ToolType;
  isShiftPressed: boolean;
  isDraggingPoint: boolean;
  selectedPoint: import('./shapes').DraggedPoint | null;
}

export interface DrawingState {
  isDrawing: boolean;
  currentShape: import('./shapes').Shape | null;
  selectedShape: import('./shapes').Shape | null;
}
