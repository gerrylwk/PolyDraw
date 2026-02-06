import { useEffect } from 'react';
import { ToolState, DraggedPoint } from '../types';

export interface UseKeyboardShortcutsProps {
  toolState: ToolState;
  onDeletePoint: (point: DraggedPoint) => void;
  onCompleteShape: () => void;
  onShiftChange: (pressed: boolean) => void;
  onCopyToClipboard?: () => void;
  onTogglePathTester?: () => void;
  onClearPath?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const useKeyboardShortcuts = ({
  toolState,
  onDeletePoint,
  onCompleteShape,
  onShiftChange,
  onCopyToClipboard,
  onTogglePathTester,
  onClearPath,
  onUndo,
  onRedo
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

      if (isTextInput) return;

      const key = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && ((key === 'z' && e.shiftKey) || key === 'y')) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        onTogglePathTester?.();
        return;
      }

      if (toolState.currentTool === 'path-tester' && (e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onClearPath?.();
        return;
      }

      if (e.key === 'Delete' && toolState.selectedPoint && toolState.currentTool === 'select') {
        e.preventDefault();
        onDeletePoint(toolState.selectedPoint);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (toolState.currentTool === 'path-tester') {
          onTogglePathTester?.();
        } else {
          onCompleteShape();
        }
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
  }, [toolState.selectedPoint, toolState.currentTool, onDeletePoint, onCompleteShape, onShiftChange, onCopyToClipboard, onTogglePathTester, onClearPath, onUndo, onRedo]);
};
