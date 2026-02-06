import React from 'react';
import { Shape, CanvasState, ImageInfo, ViewType, ToolType, DraggedPoint, PathTestPoint } from '../../types';
import { PathOverlay } from './PathOverlay';

export interface CanvasProps {
  canvasState: CanvasState;
  imageInfo: ImageInfo;
  viewType: ViewType;
  currentTool: ToolType;
  shapes: Shape[];
  currentShape: Shape | null;
  draggedPoint: DraggedPoint | null;
  canvasContainerRef: React.RefObject<HTMLDivElement>;
  canvasRef: React.RefObject<HTMLDivElement>;
  testPath?: PathTestPoint[];
  hoveredPointIndex?: number | null;
  polygonHoverState?: 'none' | 'first-point' | 'existing-point';
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  canvasState,
  imageInfo,
  viewType,
  currentTool,
  shapes,
  canvasContainerRef,
  canvasRef,
  testPath,
  hoveredPointIndex,
  polygonHoverState = 'none',
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseEnter,
  onMouseLeave
}) => {
  const { isDragging } = canvasState;

  const getCursor = () => {
    if (currentTool === 'path-tester') return 'crosshair';
    if (currentTool === 'polygon') {
      if (polygonHoverState === 'first-point') return 'pointer';
      if (polygonHoverState === 'existing-point') return 'not-allowed';
      return 'crosshair';
    }
    if (isDragging) return 'grabbing';
    return 'grab';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div
        ref={canvasContainerRef}
        className={`relative w-full h-96 lg:h-[600px] overflow-hidden bg-gray-50 ${
          viewType === 'double-panoramic' ? 'border-dashed' : ''
        }`}
        style={{
          backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          touchAction: 'none'
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDragStart={currentTool === 'path-tester' ? (e) => e.preventDefault() : undefined}
      >
        <div
          ref={canvasRef}
          className={`absolute transform-gpu origin-top-left`}
          style={{ cursor: getCursor() }}
          data-canvas
        >
          {viewType === 'double-panoramic' && imageInfo.element && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-red-400 pointer-events-none z-20"
              style={{
                top: `${imageInfo.naturalHeight / 2}px`,
                opacity: 0.7
              }}
            />
          )}

          {currentTool === 'path-tester' && testPath && testPath.length > 0 && (
            <PathOverlay
              testPath={testPath}
              shapes={shapes}
              hoveredPointIndex={hoveredPointIndex ?? null}
            />
          )}
        </div>

        {currentTool === 'path-tester' && (
          <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-xs font-medium px-2 py-1 rounded pointer-events-none z-30">
            Path Tester Active -- Draw to test points
          </div>
        )}
      </div>
    </div>
  );
};
