export type ToolType = 'select' | 'polygon' | 'circle' | 'rectangle' | 'line' | 'path-tester';

export interface ToolState {
  currentTool: ToolType;
  previousTool: ToolType | null;
  isShiftPressed: boolean;
  isDraggingPoint: boolean;
  selectedPoint: import('./shapes').DraggedPoint | null;
}

export interface DrawingState {
  isDrawing: boolean;
  currentShape: import('./shapes').Shape | null;
  selectedShape: import('./shapes').Shape | null;
}

export type PathPointStatus = 'inside' | 'outside' | 'edge';

export interface PathTestPoint {
  x: number;
  y: number;
  index: number;
  status: PathPointStatus;
  containingPolygons: string[];
  validFormat: boolean;
}

export interface PathTestingState {
  testPath: PathTestPoint[];
  isDrawing: boolean;
  isPanelCollapsed: boolean;
  textContent: string;
}
