import React from 'react';
import { ZoomIn, ZoomOut, Maximize, Trash2 } from 'lucide-react';
import { Button, Input } from '../UI';

export interface ViewControlsWidgetProps {
  scale: number;
  onZoom: (factor: number) => void;
  onResetView: () => void;
  polygonOpacity: number;
  onOpacityChange: (opacity: number) => void;
  onClearAll: () => void;
}

export const ViewControlsWidget: React.FC<ViewControlsWidgetProps> = ({
  scale,
  onZoom,
  onResetView,
  polygonOpacity,
  onOpacityChange,
  onClearAll
}) => {
  return (
    <div className="space-y-4">
      {/* View Controls */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">View Controls</label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => onZoom(1.2)}
            variant="secondary"
            icon={<ZoomIn size={16} />}
            className="justify-center"
          />
          <Button
            onClick={() => onZoom(0.8)}
            variant="secondary"
            icon={<ZoomOut size={16} />}
            className="justify-center"
          />
          <Button
            onClick={onResetView}
            variant="secondary"
            icon={<Maximize size={16} />}
            className="justify-center"
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <div>Zoom: {Math.round(scale * 100)}%</div>
          <div>Or use mouse wheel</div>
        </div>
      </div>

      {/* Polygon Opacity */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Polygon Opacity: {Math.round(polygonOpacity * 100)}%
        </label>
        <Input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={polygonOpacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Clear All */}
      <div className="border-t border-gray-200 pt-4">
        <Button
          onClick={onClearAll}
          variant="danger"
          icon={<Trash2 size={16} />}
          className="w-full justify-center"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
};
