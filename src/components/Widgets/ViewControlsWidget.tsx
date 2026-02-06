import React from 'react';
import { ZoomIn, ZoomOut, Maximize, Trash2, Undo2, Redo2 } from 'lucide-react';
import { Button, Input } from '../UI';

export interface ViewControlsWidgetProps {
  scale: number;
  onZoom: (factor: number) => void;
  onResetView: () => void;
  polygonOpacity: number;
  onOpacityChange: (opacity: number) => void;
  onClearAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const ViewControlsWidget: React.FC<ViewControlsWidgetProps> = ({
  scale,
  onZoom,
  onResetView,
  polygonOpacity,
  onOpacityChange,
  onClearAll,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  return (
    <div className="polydraw-view-controls-widget space-y-4" data-testid="view-controls-widget">
      {/* Undo / Redo Section */}
      <section className="polydraw-history-controls border-t border-gray-200 pt-4">
        <h3 className="polydraw-section-title block text-sm font-medium text-gray-700 mb-2">History</h3>
        <div className="polydraw-history-buttons grid grid-cols-2 gap-2">
          <Button
            onClick={onUndo}
            disabled={!canUndo}
            variant="secondary"
            icon={<Undo2 size={16} />}
            className="polydraw-undo-button justify-center"
            data-testid="undo-button"
          >
            Undo
          </Button>
          <Button
            onClick={onRedo}
            disabled={!canRedo}
            variant="secondary"
            icon={<Redo2 size={16} />}
            className="polydraw-redo-button justify-center"
            data-testid="redo-button"
          >
            Redo
          </Button>
        </div>
        <div className="polydraw-history-hint mt-1 text-xs text-gray-500">
          Ctrl+Z / Ctrl+Shift+Z
        </div>
      </section>

      {/* Zoom and View Controls Section */}
      <section className="polydraw-zoom-controls border-t border-gray-200 pt-4">
        <h3 className="polydraw-section-title block text-sm font-medium text-gray-700 mb-2">View Controls</h3>
        <div className="polydraw-zoom-buttons grid grid-cols-3 gap-2">
          <Button
            onClick={() => onZoom(1.2)}
            variant="secondary"
            icon={<ZoomIn size={16} />}
            className="polydraw-zoom-in-button justify-center"
            data-testid="zoom-in-button"
          />
          <Button
            onClick={() => onZoom(0.8)}
            variant="secondary"
            icon={<ZoomOut size={16} />}
            className="polydraw-zoom-out-button justify-center"
            data-testid="zoom-out-button"
          />
          <Button
            onClick={onResetView}
            variant="secondary"
            icon={<Maximize size={16} />}
            className="polydraw-reset-view-button justify-center"
            data-testid="reset-view-button"
          />
        </div>
        <div className="polydraw-zoom-info mt-2 text-xs text-gray-500">
          <div className="polydraw-current-zoom">Zoom: {Math.round(scale * 100)}%</div>
          <div className="polydraw-zoom-hint">Or use mouse wheel</div>
        </div>
      </section>

      {/* Polygon Opacity Controls Section */}
      <section className="polydraw-opacity-controls border-t border-gray-200 pt-4">
        <h3 className="polydraw-section-title block text-sm font-medium text-gray-700 mb-2">
          Polygon Opacity: <span className="polydraw-opacity-value">{Math.round(polygonOpacity * 100)}%</span>
        </h3>
        <Input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={polygonOpacity}
          onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
          className="polydraw-opacity-slider w-full"
          data-testid="opacity-slider"
        />
        <div className="polydraw-opacity-range flex justify-between text-xs text-gray-500 mt-1">
          <span className="polydraw-opacity-min">0%</span>
          <span className="polydraw-opacity-max">100%</span>
        </div>
      </section>

      {/* Clear All Section */}
      <section className="polydraw-clear-controls border-t border-gray-200 pt-4">
        <Button
          onClick={onClearAll}
          variant="danger"
          icon={<Trash2 size={16} />}
          className="polydraw-clear-all-button w-full justify-center"
          data-testid="clear-all-button"
        >
          Clear All
        </Button>
      </section>
    </div>
  );
};
