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
    <div className="polydraw-properties-widget bg-white rounded-lg shadow p-4" data-testid="properties-widget">
      <h2 className="polydraw-widget-title text-xl font-semibold mb-4 text-gray-800">Shape Properties</h2>

      {/* Canvas Settings Section */}
      <section className="polydraw-canvas-settings-section mb-6 space-y-4">
        <h3 className="polydraw-section-title text-lg font-medium text-gray-700 mb-3">Canvas Settings</h3>
        
        <div className="polydraw-normalize-setting flex items-center gap-2">
          <Input
            type="checkbox"
            checked={canvasSettings.normalize}
            onChange={(e) => onCanvasSettingsChange({ normalize: e.target.checked })}
            label="Normalize Coordinates"
            className="polydraw-normalize-checkbox"
            data-testid="properties-normalize-checkbox"
          />
        </div>

        <div className="polydraw-snap-setting flex items-center gap-2">
          <Input
            type="checkbox"
            checked={canvasSettings.snapToEdge}
            onChange={(e) => onCanvasSettingsChange({ snapToEdge: e.target.checked })}
            label="Snap to Image Edges"
            className="polydraw-snap-checkbox"
            data-testid="properties-snap-checkbox"
          />
        </div>

        {canvasSettings.snapToEdge && (
          <div className="polydraw-snap-distance-setting">
            <label className="polydraw-setting-label block text-sm font-medium text-gray-700 mb-1">
              Snap Distance: <span className="polydraw-snap-value">{canvasSettings.snapThreshold}px</span>
            </label>
            <Input
              type="range"
              min={5}
              max={50}
              value={canvasSettings.snapThreshold}
              onChange={(e) => onCanvasSettingsChange({ snapThreshold: parseInt(e.target.value) })}
              className="polydraw-snap-slider w-full"
              data-testid="properties-snap-slider"
            />
            <div className="polydraw-slider-range flex justify-between text-xs text-gray-500 mt-1">
              <span className="polydraw-range-min">5px</span>
              <span className="polydraw-range-max">50px</span>
            </div>
          </div>
        )}
      </section>

      {/* Shapes List Section */}
      <section className="polydraw-shapes-section space-y-4">
        <h3 className="polydraw-section-title text-lg font-semibold text-gray-800">Shapes</h3>
        
        {shapes.length === 0 ? (
          <p className="polydraw-empty-state text-gray-500 text-sm">No shapes created yet</p>
        ) : (
          <div className="polydraw-shapes-list space-y-4 max-h-96 overflow-y-auto">
            {shapes.map((shape) => (
              <article key={shape.id} className="polydraw-shape-card border border-gray-200 rounded-lg p-4" data-testid={`properties-shape-${shape.id}`}>
                {/* Shape Name */}
                <div className="polydraw-shape-name-section mb-3">
                  <label className="polydraw-field-label block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    type="text"
                    value={shape.name}
                    onChange={(e) => onShapeUpdate(shape.id, { name: e.target.value })}
                    className="polydraw-shape-name-input w-full"
                    data-testid={`properties-shape-name-${shape.id}`}
                  />
                </div>

                {/* Shape Color */}
                <div className="polydraw-shape-color-section mb-3">
                  <label className="polydraw-field-label block text-sm font-medium text-gray-700 mb-2">Color (RGB)</label>
                  <div className="polydraw-color-inputs grid grid-cols-3 gap-2">
                    <div className="polydraw-color-input-group">
                      <label className="polydraw-color-label block text-xs text-gray-500 mb-1">Red</label>
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
                        className="polydraw-color-input polydraw-color-input--red w-full text-sm"
                        data-testid={`properties-color-red-${shape.id}`}
                      />
                    </div>
                    <div className="polydraw-color-input-group">
                      <label className="polydraw-color-label block text-xs text-gray-500 mb-1">Green</label>
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
                        className="polydraw-color-input polydraw-color-input--green w-full text-sm"
                        data-testid={`properties-color-green-${shape.id}`}
                      />
                    </div>
                    <div className="polydraw-color-input-group">
                      <label className="polydraw-color-label block text-xs text-gray-500 mb-1">Blue</label>
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
                        className="polydraw-color-input polydraw-color-input--blue w-full text-sm"
                        data-testid={`properties-color-blue-${shape.id}`}
                      />
                    </div>
                  </div>
                  <div 
                    className="polydraw-color-preview mt-2 h-6 rounded border border-gray-300"
                    style={{ 
                      backgroundColor: `rgb(${shape.style.color.r}, ${shape.style.color.g}, ${shape.style.color.b})` 
                    }}
                    data-testid={`properties-color-preview-${shape.id}`}
                  />
                </div>

                {/* Shape Actions */}
                <div className="polydraw-shape-actions flex justify-end">
                  <Button
                    onClick={() => onShapeRemove(shape)}
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={12} />}
                    className="polydraw-delete-shape-button"
                    data-testid={`properties-delete-shape-${shape.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
