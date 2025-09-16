import React from 'react';
import { Shape, CanvasState, ImageInfo, ViewType, ToolType, DraggedPoint } from '../../types';

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
//   isDraggingPoint,
  canvasContainerRef,
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseEnter,
  onMouseLeave
}) => {
  const { isDragging } = canvasState;

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
      >
        <div
          ref={canvasRef}
          className={`absolute transform-gpu origin-top-left ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            cursor: currentTool === 'polygon' ? 'crosshair' : isDragging ? 'grabbing' : 'grab'
          }}
          data-canvas
        >
          {/* Double panoramic view divider line */}
          {viewType === 'double-panoramic' && imageInfo.element && (
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-red-400 pointer-events-none z-20"
              style={{
                top: `${imageInfo.naturalHeight / 2}px`,
                opacity: 0.7
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
