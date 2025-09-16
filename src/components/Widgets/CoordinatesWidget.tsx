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
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Coordinates</h2>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {shapes.length === 0 ? (
          <p className="text-gray-500 text-sm">No shapes created yet</p>
        ) : (
          shapes.map((shape) => (
            <div key={shape.id} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shape Name
                </label>
                <Input
                  type="text"
                  value={shape.name}
                  onChange={(e) => onShapeUpdate(shape.id, { name: e.target.value })}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points ({shape.points.length})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {shape.points.map((point, pointIndex) => (
                    <div key={pointIndex} className="bg-gray-50 p-2 rounded flex items-center gap-2">
                      <span className="font-mono text-xs min-w-[30px]">P{pointIndex + 1}:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">X:</span>
                        <Input
                          type="number"
                          value={Math.round(point.x)}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            onPointUpdate(shape.id, pointIndex, { ...point, x: newValue });
                          }}
                          className="w-16 px-1 py-0.5 text-xs"
                          step={1}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Y:</span>
                        <Input
                          type="number"
                          value={Math.round(point.y)}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            onPointUpdate(shape.id, pointIndex, { ...point, y: newValue });
                          }}
                          className="w-16 px-1 py-0.5 text-xs"
                          step={1}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
