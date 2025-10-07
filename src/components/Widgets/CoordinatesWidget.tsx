import React from 'react';
import { Shape, Point } from '../../types';
import { Input } from '../UI';

export interface CoordinatesWidgetProps {
  shapes: Shape[];
  onShapeUpdate: (shapeId: string, updates: Partial<Shape>) => void;
  onPointUpdate: (shapeId: string, pointIndex: number, newPoint: Point) => void;
}

export const CoordinatesWidget: React.FC<CoordinatesWidgetProps> = ({
  shapes,
  onShapeUpdate,
  onPointUpdate
}) => {
  return (
    <div className="polydraw-coordinates-widget bg-white rounded-lg shadow p-4" data-testid="coordinates-widget">
      <h2 className="polydraw-widget-title text-xl font-semibold mb-4 text-gray-800">Coordinates</h2>
      
      <div className="polydraw-shapes-container space-y-4 max-h-96 overflow-y-auto">
        {shapes.length === 0 ? (
          <p className="polydraw-empty-state text-gray-500 text-sm">No shapes created yet</p>
        ) : (
          shapes.map((shape) => (
            <article key={shape.id} className="polydraw-shape-card border border-gray-200 rounded-lg p-4" data-testid={`coordinates-shape-${shape.id}`}>
              <div className="polydraw-shape-name-section mb-3">
                <label className="polydraw-field-label block text-sm font-medium text-gray-700 mb-1">
                  Shape Name
                </label>
                <Input
                  type="text"
                  value={shape.name}
                  onChange={(e) => onShapeUpdate(shape.id, { name: e.target.value })}
                  className="polydraw-shape-name-input w-full"
                  data-testid={`shape-name-${shape.id}`}
                />
              </div>
              
              <div className="polydraw-points-section">
                <label className="polydraw-field-label block text-sm font-medium text-gray-700 mb-2">
                  Points (<span className="polydraw-points-count">{shape.points.length}</span>)
                </label>
                <div className="polydraw-points-grid grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {shape.points.map((point, pointIndex) => (
                    <div key={pointIndex} className="polydraw-point-editor bg-gray-50 p-2 rounded flex items-center gap-2" data-testid={`coordinates-point-${shape.id}-${pointIndex}`}>
                      <span className="polydraw-point-label font-mono text-xs min-w-[30px]">P{pointIndex + 1}:</span>
                      <div className="polydraw-coordinate-group flex items-center gap-1">
                        <span className="polydraw-coordinate-label text-xs text-gray-500">X:</span>
                        <Input
                          type="number"
                          value={Math.round(point.x)}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            onPointUpdate(shape.id, pointIndex, { ...point, x: newValue });
                          }}
                          className="polydraw-coordinate-input polydraw-coordinate-input--x w-16 px-1 py-0.5 text-xs"
                          step={1}
                          data-testid={`coordinates-x-${shape.id}-${pointIndex}`}
                        />
                      </div>
                      <div className="polydraw-coordinate-group flex items-center gap-1">
                        <span className="polydraw-coordinate-label text-xs text-gray-500">Y:</span>
                        <Input
                          type="number"
                          value={Math.round(point.y)}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            onPointUpdate(shape.id, pointIndex, { ...point, y: newValue });
                          }}
                          className="polydraw-coordinate-input polydraw-coordinate-input--y w-16 px-1 py-0.5 text-xs"
                          step={1}
                          data-testid={`coordinates-y-${shape.id}-${pointIndex}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};
