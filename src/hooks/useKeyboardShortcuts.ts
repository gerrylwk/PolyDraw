import { useEffect } from 'react';
import { ToolState, DraggedPoint } from '../types';

export interface UseKeyboardShortcutsProps {
  toolState: ToolState;
  onDeletePoint: (point: DraggedPoint) => void;
  onCompleteShape: () => void;
  onShiftChange: (pressed: boolean) => void;
  onCopyToClipboard?: () => void;
}

export const useKeyboardShortcuts = ({
  toolState,
  onDeletePoint,
  onCompleteShape,
  onShiftChange,
  onCopyToClipboard
}: UseKeyboardShortcutsProps): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        onShiftChange(true);
      }

      const isTextInput = e.target instanceof HTMLInputElement ||
                          e.target instanceof HTMLTextAreaElement;

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isTextInput) {
        if (onCopyToClipboard) {
          e.preventDefault();
          onCopyToClipboard();
        }
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
  }, [toolState.selectedPoint, toolState.currentTool, onDeletePoint, onCompleteShape, onShiftChange, onCopyToClipboard]);
};
