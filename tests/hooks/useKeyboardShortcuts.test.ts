import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';
import { ToolState, DraggedPoint, PolygonShape } from '../../src/types';

describe('useKeyboardShortcuts', () => {
  const mockShape: PolygonShape = {
    id: 'test-shape',
    type: 'polygon',
    name: 'Test Shape',
    points: [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ],
    style: {
      color: { r: 255, g: 0, b: 0 },
      opacity: 0.5,
      strokeWidth: 2,
    },
    pointElements: [],
  };

  const mockSelectedPoint: DraggedPoint = {
    shape: mockShape,
    index: 0,
  };

  let onDeletePoint: ReturnType<typeof vi.fn>;
  let onCompleteShape: ReturnType<typeof vi.fn>;
  let onShiftChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onDeletePoint = vi.fn();
    onCompleteShape = vi.fn();
    onShiftChange = vi.fn();
  });

  describe('Shift Key Handling', () => {
    it('should call onShiftChange(true) when Shift is pressed', () => {
      const toolState: ToolState = {
        currentTool: 'polygon',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: null,
      };

      renderHook(() =>
        useKeyboardShortcuts({
          toolState,
          onDeletePoint,
          onCompleteShape,
          onShiftChange,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Shift' });
      window.dispatchEvent(event);

      expect(onShiftChange).toHaveBeenCalledWith(true);
    });

    it('should call onShiftChange(false) when Shift is released', () => {
      const toolState: ToolState = {
        currentTool: 'polygon',
        isShiftPressed: true,
        isDraggingPoint: false,
        selectedPoint: null,
      };

      renderHook(() =>
        useKeyboardShortcuts({
          toolState,
          onDeletePoint,
          onCompleteShape,
          onShiftChange,
        })
      );

      const event = new KeyboardEvent('keyup', { key: 'Shift' });
      window.dispatchEvent(event);

      expect(onShiftChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Delete Key Handling', () => {
    it('should call onDeletePoint when Delete is pressed with selected point', () => {
      const toolState: ToolState = {
        currentTool: 'select',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: mockSelectedPoint,
      };

      renderHook(() =>
        useKeyboardShortcuts({
          toolState,
          onDeletePoint,
          onCompleteShape,
          onShiftChange,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      window.dispatchEvent(event);

      expect(onDeletePoint).toHaveBeenCalledWith(mockSelectedPoint);
    });

    it('should not call onDeletePoint when no point is selected', () => {
      const toolState: ToolState = {
        currentTool: 'select',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: null,
      };

      renderHook(() =>
        useKeyboardShortcuts({
          toolState,
          onDeletePoint,
          onCompleteShape,
          onShiftChange,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      window.dispatchEvent(event);

      expect(onDeletePoint).not.toHaveBeenCalled();
    });

    it('should not call onDeletePoint when tool is not select', () => {
      const toolState: ToolState = {
        currentTool: 'polygon',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: mockSelectedPoint,
      };

      renderHook(() =>
        useKeyboardShortcuts({
          toolState,
          onDeletePoint,
          onCompleteShape,
          onShiftChange,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      window.dispatchEvent(event);

      expect(onDeletePoint).not.toHaveBeenCalled();
    });

    it('should prevent default on Delete key', () => {
      const toolState: ToolState = {
        currentTool: 'select',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: mockSelectedPoint,
      };

      renderHook(() =>
        useKeyboardShortcuts({
          toolState,
          onDeletePoint,
          onCompleteShape,
          onShiftChange,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Escape Key Handling', () => {
    it('should call onCompleteShape when Escape is pressed', () => {
      const toolState: ToolState = {
        currentTool: 'polygon',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: null,
      };

      renderHook(() =>
        useKeyboardShortcuts({
          toolState,
          onDeletePoint,
          onCompleteShape,
          onShiftChange,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(onCompleteShape).toHaveBeenCalled();
    });

    it('should prevent default on Escape key', () => {
      const toolState: ToolState = {
        currentTool: 'polygon',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: null,
      };

      renderHook(() =>
        useKeyboardShortcuts({
          toolState,
          onDeletePoint,
          onCompleteShape,
          onShiftChange,
        })
      );

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const toolState: ToolState = {
        currentTool: 'polygon',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: null,
      };

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          toolState,
          onDeletePoint,
          onCompleteShape,
          onShiftChange,
        })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Event Handler Updates', () => {
    it('should update handlers when dependencies change', () => {
      const toolState1: ToolState = {
        currentTool: 'polygon',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: null,
      };

      const { rerender } = renderHook(
        ({ toolState }) =>
          useKeyboardShortcuts({
            toolState,
            onDeletePoint,
            onCompleteShape,
            onShiftChange,
          }),
        { initialProps: { toolState: toolState1 } }
      );

      const toolState2: ToolState = {
        currentTool: 'select',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: mockSelectedPoint,
      };

      rerender({ toolState: toolState2 });

      const event = new KeyboardEvent('keydown', { key: 'Delete' });
      window.dispatchEvent(event);

      expect(onDeletePoint).toHaveBeenCalledWith(mockSelectedPoint);
    });
  });
});

