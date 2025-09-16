import React from 'react';
import { Trash2 } from 'lucide-react';
import { Shape, ShapeStyle, CanvasSettings } from '../../types';
import { Button, Input } from '../UI';

export interface PropertiesWidgetProps {
  shapes: Shape[];
  canvasSettings: CanvasSettings;
  onShapeUpdate: (shapeId: string, updates: Partial<Shape>) => void;
  onShapeRemove: (shape: Shape) => void;
  onShapeStyleUpdate: (shapeId: string, style: Partial<ShapeStyle>) => void;
  onCanvasSettingsChange: (settings: Partial<CanvasSettings>) => void;
}

export const PropertiesWidget: React.FC<PropertiesWidgetProps> = ({
  shapes,
  canvasSettings,
  onShapeUpdate,
  onShapeRemove,
  onShapeStyleUpdate,
  onCanvasSettingsChange
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Shape Properties</h2>

      {/* Canvas Settings */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="checkbox"
            checked={canvasSettings.normalize}
            onChange={(e) => onCanvasSettingsChange({ normalize: e.target.checked })}
            label="Normalize Coordinates"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="checkbox"
            checked={canvasSettings.snapToEdge}
            onChange={(e) => onCanvasSettingsChange({ snapToEdge: e.target.checked })}
            label="Snap to Image Edges"
          />
        </div>

        {canvasSettings.snapToEdge && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Snap Distance: {canvasSettings.snapThreshold}px
            </label>
            <Input
              type="range"
              min={5}
              max={50}
              value={canvasSettings.snapThreshold}
              onChange={(e) => onCanvasSettingsChange({ snapThreshold: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5px</span>
              <span>50px</span>
            </div>
          </div>
        )}
      </div>

      {/* Shape List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Shapes</h3>
        
        {shapes.length === 0 ? (
          <p className="text-gray-500 text-sm">No shapes created yet</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {shapes.map((shape) => (
              <div key={shape.id} className="border border-gray-200 rounded-lg p-4">
                {/* Shape Name */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    type="text"
                    value={shape.name}
                    onChange={(e) => onShapeUpdate(shape.id, { name: e.target.value })}
                    className="w-full"
                  />
                </div>

                {/* Shape Color */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color (RGB)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Red</label>
                      <Input
                        type="number"
                        min={0}
                        max={255}
                        value={shape.style.color.r}
                        onChange={(e) => onShapeStyleUpdate(shape.id, {
                          color: {
                            ...shape.style.color,
                            r: Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                          }
                        })}
                        className="w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Green</label>
                      <Input
                        type="number"
                        min={0}
                        max={255}
                        value={shape.style.color.g}
                        onChange={(e) => onShapeStyleUpdate(shape.id, {
                          color: {
                            ...shape.style.color,
                            g: Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                          }
                        })}
                        className="w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Blue</label>
                      <Input
                        type="number"
                        min={0}
                        max={255}
                        value={shape.style.color.b}
                        onChange={(e) => onShapeStyleUpdate(shape.id, {
                          color: {
                            ...shape.style.color,
                            b: Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                          }
                        })}
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                  <div 
                    className="mt-2 h-6 rounded border border-gray-300"
                    style={{ 
                      backgroundColor: `rgb(${shape.style.color.r}, ${shape.style.color.g}, ${shape.style.color.b})` 
                    }}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => onShapeRemove(shape)}
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={12} />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
