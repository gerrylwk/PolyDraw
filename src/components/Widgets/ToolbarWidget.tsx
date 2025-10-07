import React from 'react';
import { Upload, MousePointer, Move, Circle, Square, Minus } from 'lucide-react';
import { ToolType, ViewType } from '../../types';
import { Button } from '../UI';

export interface ToolbarWidgetProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
  fileName: string;
  onFileUpload: (file: File) => void;
  isShiftPressed: boolean;
}

export const ToolbarWidget: React.FC<ToolbarWidgetProps> = ({
  currentTool,
  onToolChange,
  viewType,
  onViewTypeChange,
  fileName,
  onFileUpload,
  isShiftPressed
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const tools = [
    { id: 'select' as ToolType, icon: MousePointer, label: 'Select' },
    { id: 'polygon' as ToolType, icon: Move, label: 'Polygon' },
    { id: 'circle' as ToolType, icon: Circle, label: 'Circle' },
    { id: 'rectangle' as ToolType, icon: Square, label: 'Rectangle' },
    { id: 'line' as ToolType, icon: Minus, label: 'Line' }
  ];

  return (
    <div className="polydraw-toolbar-widget bg-white rounded-lg shadow p-4" data-testid="toolbar-widget">
      <h2 className="polydraw-widget-title text-xl font-semibold mb-4 text-gray-800">Tools</h2>

      <div className="polydraw-toolbar-sections space-y-4">
        {/* File Upload Section */}
        <section className="polydraw-file-upload-section">
          <h3 className="polydraw-section-title block text-sm font-medium text-gray-700 mb-2">Upload Image</h3>
          <div className="polydraw-file-upload-controls flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="polydraw-file-input hidden"
              data-testid="file-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload size={16} />}
              className="polydraw-file-upload-button flex-1"
              data-testid="file-upload-button"
            >
              Choose File
            </Button>
          </div>
          <div className="polydraw-file-name text-xs text-gray-500 mt-1 truncate" data-testid="file-name">
            {fileName}
          </div>
        </section>

        {/* View Type Section */}
        <section className="polydraw-view-type-section border-t border-gray-200 pt-4">
          <h3 className="polydraw-section-title block text-sm font-medium text-gray-700 mb-2">View Type</h3>
          <select
            value={viewType}
            onChange={(e) => onViewTypeChange(e.target.value as ViewType)}
            className="polydraw-view-type-select w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            data-testid="view-type-select"
          >
            <option value="static">Static View</option>
            <option value="double-panoramic">Double Panoramic View</option>
          </select>
          <div className="polydraw-view-type-description text-xs text-gray-500 mt-1">
            {viewType === 'static' 
              ? 'Normal single image view' 
              : 'Top and bottom halves are separate images'
            }
          </div>
        </section>

        {/* Drawing Tools Section */}
        <section className="polydraw-drawing-tools-section border-t border-gray-200 pt-4">
          <h3 className="polydraw-section-title block text-sm font-medium text-gray-700 mb-2">Drawing Tools</h3>
          <div className="polydraw-tool-buttons grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                variant={currentTool === tool.id ? 'primary' : 'secondary'}
                icon={<tool.icon size={16} />}
                className={`polydraw-tool-button polydraw-tool-button--${tool.id} justify-center gap-2 ${
                  currentTool === tool.id ? 'polydraw-tool-button--active' : 'polydraw-tool-button--inactive'
                }`}
                data-testid={`tool-button-${tool.id}`}
                data-tool={tool.id}
              >
                {tool.label}
              </Button>
            ))}
          </div>
        </section>

        {/* Line Straightening Info Section */}
        <section className="polydraw-line-straightening-section border-t border-gray-200 pt-4">
          <h3 className="polydraw-section-title block text-sm font-medium text-gray-700 mb-2">Line Straightening</h3>
          <div className="polydraw-shift-status-panel bg-blue-50 p-3 rounded-lg">
            <div className="polydraw-shift-indicator flex items-center gap-2 mb-2">
              <div className={`polydraw-shift-status-dot w-3 h-3 rounded-full ${
                isShiftPressed ? 'polydraw-shift-active bg-green-500' : 'polydraw-shift-inactive bg-gray-300'
              }`}></div>
              <span className="polydraw-shift-status-text text-sm font-medium">
                {isShiftPressed ? 'Shift Active' : 'Shift Inactive'}
              </span>
            </div>
            <div className="polydraw-shift-instructions text-xs text-gray-600">
              <p className="polydraw-shift-hint mb-1">
                Hold <kbd className="polydraw-kbd px-1 py-0.5 bg-gray-200 rounded text-xs">Shift</kbd> while drawing to straighten lines:
              </p>
              <ul className="polydraw-line-types list-disc list-inside space-y-0.5 ml-2">
                <li className="polydraw-line-type">Horizontal lines</li>
                <li className="polydraw-line-type">Vertical lines</li>
                <li className="polydraw-line-type">45° diagonal lines</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
