import { useState, useCallback } from 'react';
import { ToolType, ToolState, DraggedPoint } from '../types';

export interface UseToolsReturn {
  toolState: ToolState;
  draggedPoint: DraggedPoint | null;
  
  // Actions
  setCurrentTool: (tool: ToolType) => void;
  setShiftPressed: (pressed: boolean) => void;
  setDraggingPoint: (dragging: boolean, point?: DraggedPoint) => void;
  setSelectedPoint: (point: DraggedPoint | null) => void;
}

export const useTools = (): UseToolsReturn => {
  const [toolState, setToolState] = useState<ToolState>({
    currentTool: 'polygon',
    isShiftPressed: false,
    isDraggingPoint: false,
    selectedPoint: null
  });

  const [draggedPoint, setDraggedPoint] = useState<DraggedPoint | null>(null);

  const setCurrentTool = useCallback((tool: ToolType) => {
    setToolState(prev => ({ ...prev, currentTool: tool }));
  }, []);

  const setShiftPressed = useCallback((pressed: boolean) => {
    setToolState(prev => ({ ...prev, isShiftPressed: pressed }));
  }, []);

  const setDraggingPoint = useCallback((dragging: boolean, point?: DraggedPoint) => {
    setToolState(prev => ({ ...prev, isDraggingPoint: dragging }));
    setDraggedPoint(point || null);
  }, []);

  const setSelectedPoint = useCallback((point: DraggedPoint | null) => {
    setToolState(prev => ({ ...prev, selectedPoint: point }));
    
    // Visual feedback for selected point
    document.querySelectorAll('[data-point]').forEach(p => p.classList.remove('ring-2', 'ring-red-400'));
    if (point && point.shape.pointElements[point.index]) {
      point.shape.pointElements[point.index].classList.add('ring-2', 'ring-red-400');
    }
  }, []);

  return {
    toolState,
    draggedPoint,
    setCurrentTool,
    setShiftPressed,
    setDraggingPoint,
    setSelectedPoint
  };
};
