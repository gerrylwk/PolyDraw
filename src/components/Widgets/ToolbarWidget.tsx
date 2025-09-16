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
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Tools</h2>

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload size={16} />}
              className="flex-1"
            >
              Choose File
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate">{fileName}</div>
        </div>

        {/* View Type */}
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
          <select
            value={viewType}
            onChange={(e) => onViewTypeChange(e.target.value as ViewType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          >
            <option value="static">Static View</option>
            <option value="double-panoramic">Double Panoramic View</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            {viewType === 'static' 
              ? 'Normal single image view' 
              : 'Top and bottom halves are separate images'
            }
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Drawing Tools</label>
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                variant={currentTool === tool.id ? 'primary' : 'secondary'}
                icon={<tool.icon size={16} />}
                className="justify-center gap-2"
              >
                {tool.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Line Straightening Info */}
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Line Straightening</label>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isShiftPressed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium">
                {isShiftPressed ? 'Shift Active' : 'Shift Inactive'}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              <p className="mb-1">Hold <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Shift</kbd> while drawing to straighten lines:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Horizontal lines</li>
                <li>Vertical lines</li>
                <li>45° diagonal lines</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
