import { useEffect } from 'react';
import { ToolState, DraggedPoint } from '../types';

export interface UseKeyboardShortcutsProps {
  toolState: ToolState;
  onDeletePoint: (point: DraggedPoint) => void;
  onCompleteShape: () => void;
  onShiftChange: (pressed: boolean) => void;
}

export const useKeyboardShortcuts = ({
  toolState,
  onDeletePoint,
  onCompleteShape,
  onShiftChange
}: UseKeyboardShortcutsProps): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        onShiftChange(true);
      }
      if (e.key === 'Delete' && toolState.selectedPoint && toolState.currentTool === 'select') {
        e.preventDefault();
        onDeletePoint(toolState.selectedPoint);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCompleteShape();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        onShiftChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [toolState.selectedPoint, toolState.currentTool, onDeletePoint, onCompleteShape, onShiftChange]);
};
