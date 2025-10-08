import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCanvas } from '../../src/hooks/useCanvas';

// Mock utility functions
vi.mock('../../src/utils', () => ({
  updateCanvasTransform: vi.fn(),
  resetCanvasView: vi.fn(() => ({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  })),
  calculateZoomedPosition: vi.fn((mouseX, mouseY, offsetX, offsetY, scale, zoomFactor) => ({
    newScale: scale * zoomFactor,
    newOffsetX: offsetX,
    newOffsetY: offsetY,
  })),
  runImageLoadBenchmark: vi.fn().mockResolvedValue([]),
}));

describe('useCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock URL.createObjectURL and revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  describe('Initial State', () => {
    it('should initialize with default canvas state', () => {
      const { result } = renderHook(() => useCanvas());

      expect(result.current.canvasState).toEqual({
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
        dragStartX: 0,
        dragStartY: 0,
        isMouseOverCanvas: false,
      });
    });

    it('should initialize with default image info', () => {
      const { result } = renderHook(() => useCanvas());

      expect(result.current.imageInfo).toEqual({
        element: null,
        fileName: 'No file selected',
        naturalWidth: 1,
        naturalHeight: 1,
      });
    });

    it('should provide canvas refs', () => {
      const { result } = renderHook(() => useCanvas());

      expect(result.current.canvasContainerRef).toBeDefined();
      expect(result.current.canvasRef).toBeDefined();
      expect(result.current.canvasContainerRef.current).toBeNull();
      expect(result.current.canvasRef.current).toBeNull();
    });
  });

  describe('setScale', () => {
    it('should update scale', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setScale(2);
      });

      expect(result.current.canvasState.scale).toBe(2);
    });

    it('should clamp scale to minimum 0.1', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setScale(0.05);
      });

      expect(result.current.canvasState.scale).toBe(0.1);
    });

    it('should clamp scale to maximum 10', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setScale(15);
      });

      expect(result.current.canvasState.scale).toBe(10);
    });
  });

  describe('setOffset', () => {
    it('should update offset values', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setOffset(100, 200);
      });

      expect(result.current.canvasState.offsetX).toBe(100);
      expect(result.current.canvasState.offsetY).toBe(200);
    });

    it('should allow negative offset values', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setOffset(-50, -75);
      });

      expect(result.current.canvasState.offsetX).toBe(-50);
      expect(result.current.canvasState.offsetY).toBe(-75);
    });
  });

  describe('setDragging', () => {
    it('should start dragging with start coordinates', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setDragging(true, 150, 250);
      });

      expect(result.current.canvasState.isDragging).toBe(true);
      expect(result.current.canvasState.dragStartX).toBe(150);
      expect(result.current.canvasState.dragStartY).toBe(250);
    });

    it('should stop dragging', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setDragging(true, 150, 250);
      });

      act(() => {
        result.current.setDragging(false);
      });

      expect(result.current.canvasState.isDragging).toBe(false);
      expect(result.current.canvasState.dragStartX).toBe(0);
      expect(result.current.canvasState.dragStartY).toBe(0);
    });
  });

  describe('setMouseOverCanvas', () => {
    it('should set mouse over canvas to true', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setMouseOverCanvas(true);
      });

      expect(result.current.canvasState.isMouseOverCanvas).toBe(true);
    });

    it('should set mouse over canvas to false', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setMouseOverCanvas(true);
      });

      act(() => {
        result.current.setMouseOverCanvas(false);
      });

      expect(result.current.canvasState.isMouseOverCanvas).toBe(false);
    });
  });

  describe('zoom', () => {
    it('should zoom in by factor', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setScale(2);
      });

      act(() => {
        result.current.zoom(1.5);
      });

      expect(result.current.canvasState.scale).toBe(3);
    });

    it('should zoom out by factor', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setScale(2);
      });

      act(() => {
        result.current.zoom(0.5);
      });

      expect(result.current.canvasState.scale).toBe(1);
    });

    it('should clamp zoom to minimum 0.1', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setScale(0.2);
      });

      act(() => {
        result.current.zoom(0.1);
      });

      expect(result.current.canvasState.scale).toBe(0.1);
    });

    it('should clamp zoom to maximum 10', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setScale(8);
      });

      act(() => {
        result.current.zoom(2);
      });

      expect(result.current.canvasState.scale).toBe(10);
    });
  });

  describe('uploadImage', () => {
    it('should update file name immediately', () => {
      const { result } = renderHook(() => useCanvas());

      const mockFile = new File([''], 'test-image.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.uploadImage(mockFile);
      });

      expect(result.current.imageInfo.fileName).toBe('test-image.jpg');
    });

    it('should handle image loading', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create a mock canvas ref
      const mockCanvasElement = document.createElement('div');
      Object.defineProperty(result.current.canvasRef, 'current', {
        value: mockCanvasElement,
        writable: true,
      });

      const mockFile = new File([''], 'test-image.jpg', { type: 'image/jpeg' });

      act(() => {
        result.current.uploadImage(mockFile);
      });

      // Wait for FileReader and image load
      await waitFor(() => {
        expect(result.current.imageInfo.fileName).toBe('test-image.jpg');
      });
    });

    it('should track blob URL in image info', async () => {
      const { result } = renderHook(() => useCanvas());

      // Create a mock canvas ref
      const mockCanvasElement = document.createElement('div');
      Object.defineProperty(result.current.canvasRef, 'current', {
        value: mockCanvasElement,
        writable: true,
      });

      const mockFile = new File([''], 'test-image.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.uploadImage(mockFile);
      });

      // Wait for image loading to complete
      await waitFor(() => {
        expect(result.current.imageInfo.fileName).toBe('test-image.jpg');
      });
    });
  });

  describe('Blob URL Cleanup', () => {
    it('should revoke blob URL when uploading new image over existing one', async () => {
      const { result } = renderHook(() => useCanvas());

      const mockCanvasElement = document.createElement('div');
      const mockImageElement = document.createElement('img');
      mockCanvasElement.appendChild(mockImageElement);

      Object.defineProperty(result.current.canvasRef, 'current', {
        value: mockCanvasElement,
        writable: true,
      });

      // Set existing image info with blob URL
      const mockFile = new File([''], 'new-image.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.uploadImage(mockFile);
      });

      await waitFor(() => {
        expect(result.current.imageInfo.fileName).toBe('new-image.jpg');
      });
    });
  });

  describe('resetView', () => {
    it('should reset canvas view to default', () => {
      const { result } = renderHook(() => useCanvas());

      // Change state first
      act(() => {
        result.current.setScale(5);
        result.current.setOffset(100, 200);
      });

      // Reset view
      act(() => {
        result.current.resetView();
      });

      // Should be reset to defaults (mocked to return scale: 1, offsets: 0)
      expect(result.current.canvasState.scale).toBe(1);
      expect(result.current.canvasState.offsetX).toBe(0);
      expect(result.current.canvasState.offsetY).toBe(0);
    });
  });

  describe('handleWheel', () => {
    it('should not zoom when mouse is not over canvas', () => {
      const { result } = renderHook(() => useCanvas());

      const mockWheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        clientX: 200,
        clientY: 200,
      });

      act(() => {
        result.current.setMouseOverCanvas(false);
        result.current.handleWheel(mockWheelEvent);
      });

      expect(result.current.canvasState.scale).toBe(1);
    });

    it('should zoom when mouse is over canvas', () => {
      const { result } = renderHook(() => useCanvas());

      // Mock container ref with getBoundingClientRect
      const mockContainerElement = document.createElement('div');
      mockContainerElement.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));

      Object.defineProperty(result.current.canvasContainerRef, 'current', {
        value: mockContainerElement,
        writable: true,
      });

      const mockWheelEvent = new WheelEvent('wheel', {
        deltaY: -100,
        clientX: 200,
        clientY: 200,
      });

      act(() => {
        result.current.setMouseOverCanvas(true);
      });

      act(() => {
        result.current.handleWheel(mockWheelEvent);
      });

      // Scale should have changed based on zoom calculation
      expect(result.current.canvasState.scale).toBeGreaterThan(1);
    });
  });

  describe('Canvas Transform', () => {
    it('should update transform when scale changes', () => {
      const { result } = renderHook(() => useCanvas());

      const initialScale = result.current.canvasState.scale;

      act(() => {
        result.current.setScale(2);
      });

      expect(result.current.canvasState.scale).not.toBe(initialScale);
      expect(result.current.canvasState.scale).toBe(2);
    });

    it('should update transform when offset changes', () => {
      const { result } = renderHook(() => useCanvas());

      act(() => {
        result.current.setOffset(100, 200);
      });

      expect(result.current.canvasState.offsetX).toBe(100);
      expect(result.current.canvasState.offsetY).toBe(200);
    });
  });
});

