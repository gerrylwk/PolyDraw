import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTools } from '../../src/hooks/useTools';
import { DraggedPoint, PolygonShape } from '../../src/types';

describe('useTools', () => {
  beforeEach(() => {
    // Clear any selected points
    document.body.innerHTML = '';
  });

  describe('Initial State', () => {
    it('should initialize with default tool state', () => {
      const { result } = renderHook(() => useTools());

      expect(result.current.toolState).toEqual({
        currentTool: 'polygon',
        isShiftPressed: false,
        isDraggingPoint: false,
        selectedPoint: null,
      });
    });

    it('should initialize with null dragged point', () => {
      const { result } = renderHook(() => useTools());

      expect(result.current.draggedPoint).toBeNull();
    });
  });

  describe('setCurrentTool', () => {
    it('should update current tool to select', () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setCurrentTool('select');
      });

      expect(result.current.toolState.currentTool).toBe('select');
    });

    it('should update current tool to polygon', () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setCurrentTool('select');
      });

      act(() => {
        result.current.setCurrentTool('polygon');
      });

      expect(result.current.toolState.currentTool).toBe('polygon');
    });
  });

  describe('setShiftPressed', () => {
    it('should set shift pressed to true', () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setShiftPressed(true);
      });

      expect(result.current.toolState.isShiftPressed).toBe(true);
    });

    it('should set shift pressed to false', () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setShiftPressed(true);
      });

      act(() => {
        result.current.setShiftPressed(false);
      });

      expect(result.current.toolState.isShiftPressed).toBe(false);
    });
  });

  describe('setDraggingPoint', () => {
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

    const mockDraggedPoint: DraggedPoint = {
      shape: mockShape,
      index: 0,
    };

    it('should start dragging a point', () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setDraggingPoint(true, mockDraggedPoint);
      });

      expect(result.current.toolState.isDraggingPoint).toBe(true);
      expect(result.current.draggedPoint).toEqual(mockDraggedPoint);
    });

    it('should stop dragging a point', () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setDraggingPoint(true, mockDraggedPoint);
      });

      act(() => {
        result.current.setDraggingPoint(false);
      });

      expect(result.current.toolState.isDraggingPoint).toBe(false);
      expect(result.current.draggedPoint).toBeNull();
    });
  });

  describe('setSelectedPoint', () => {
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

    it('should set selected point', () => {
      const { result } = renderHook(() => useTools());

      const selectedPoint: DraggedPoint = {
        shape: mockShape,
        index: 0,
      };

      act(() => {
        result.current.setSelectedPoint(selectedPoint);
      });

      expect(result.current.toolState.selectedPoint).toEqual(selectedPoint);
    });

    it('should clear selected point', () => {
      const { result } = renderHook(() => useTools());

      const selectedPoint: DraggedPoint = {
        shape: mockShape,
        index: 0,
      };

      act(() => {
        result.current.setSelectedPoint(selectedPoint);
      });

      act(() => {
        result.current.setSelectedPoint(null);
      });

      expect(result.current.toolState.selectedPoint).toBeNull();
    });

    it('should add visual feedback classes to selected point element', () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-point', '0');
      document.body.appendChild(mockElement);

      const shapeWithElements: PolygonShape = {
        ...mockShape,
        pointElements: [mockElement],
      };

      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setSelectedPoint({
          shape: shapeWithElements,
          index: 0,
        });
      });

      expect(mockElement.classList.contains('ring-2')).toBe(true);
      expect(mockElement.classList.contains('ring-red-400')).toBe(true);
    });

    it('should remove visual feedback from previously selected point', () => {
      const mockElement1 = document.createElement('div');
      mockElement1.setAttribute('data-point', '0');
      document.body.appendChild(mockElement1);

      const mockElement2 = document.createElement('div');
      mockElement2.setAttribute('data-point', '1');
      document.body.appendChild(mockElement2);

      const shapeWithElements: PolygonShape = {
        ...mockShape,
        pointElements: [mockElement1, mockElement2],
      };

      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setSelectedPoint({
          shape: shapeWithElements,
          index: 0,
        });
      });

      expect(mockElement1.classList.contains('ring-2')).toBe(true);

      act(() => {
        result.current.setSelectedPoint({
          shape: shapeWithElements,
          index: 1,
        });
      });

      expect(mockElement1.classList.contains('ring-2')).toBe(false);
      expect(mockElement2.classList.contains('ring-2')).toBe(true);
    });
  });

  describe('Tool State Persistence', () => {
    it('should maintain tool state across multiple updates', () => {
      const { result } = renderHook(() => useTools());

      act(() => {
        result.current.setCurrentTool('select');
        result.current.setShiftPressed(true);
      });

      expect(result.current.toolState.currentTool).toBe('select');
      expect(result.current.toolState.isShiftPressed).toBe(true);

      act(() => {
        result.current.setCurrentTool('polygon');
      });

      // Shift state should persist when tool changes
      expect(result.current.toolState.isShiftPressed).toBe(true);
    });
  });
});

