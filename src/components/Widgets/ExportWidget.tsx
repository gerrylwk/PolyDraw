import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Shape, ImageInfo, CanvasSettings } from '../../types';
import { Button } from '../UI';

export interface ExportWidgetProps {
  shapes: Shape[];
  imageInfo: ImageInfo;
  canvasSettings: CanvasSettings;
}

export const ExportWidget: React.FC<ExportWidgetProps> = ({
  shapes,
  imageInfo,
  canvasSettings
}) => {
  const [copied, setCopied] = useState(false);
  const [editingSVGString, setEditingSVGString] = useState('');
  const [isEditingSVG, setIsEditingSVG] = useState(false);
  const [editingPythonString, setEditingPythonString] = useState('');
  const [isEditingPython, setIsEditingPython] = useState(false);

  const generatePythonCode = (): string => {
    if (shapes.length === 0) return '# No shapes created yet';

    const imgWidth = imageInfo.naturalWidth || 1;
    const imgHeight = imageInfo.naturalHeight || 1;

    let code = '';
    shapes.forEach((shape, index) => {
      code += `# ${shape.name}\n`;
      code += `shape_${index + 1} = [`;

      const points = shape.points.map(point => {
        if (canvasSettings.normalize && imageInfo.element) {
          return `(${(point.x / imgWidth).toFixed(4)}, ${(point.y / imgHeight).toFixed(4)})`;
        }
        return `(${Math.round(point.x)}, ${Math.round(point.y)})`;
      });
      code += points.join(', ');
      code += ']\n\n';
    });

    return code;
  };

  const generateSVGString = (): string => {
    if (shapes.length === 0) return '# No shapes created yet';

    const imgWidth = imageInfo.naturalWidth || 1;
    const imgHeight = imageInfo.naturalHeight || 1;

    let svgString = '';
    shapes.forEach((shape) => {
      svgString += `# ${shape.name}\n`;
      
      const points = shape.points.map(point => {
        if (canvasSettings.normalize && imageInfo.element) {
          return `${(point.x / imgWidth).toFixed(4)} ${(point.y / imgHeight).toFixed(4)}`;
        }
        return `${Math.round(point.x)} ${Math.round(point.y)}`;
      });

      svgString += points.join(' ');
      svgString += '\n\n';
    });

    return svgString;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const startEditingSVG = () => {
    setEditingSVGString(generateSVGString());
    setIsEditingSVG(true);
  };

  const startEditingPython = () => {
    setEditingPythonString(generatePythonCode());
    setIsEditingPython(true);
  };

  return (
    <div className="space-y-6">
      {/* Python Format */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Python Format</h3>
        {!isEditingPython ? (
          <>
            <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
              <pre>{generatePythonCode()}</pre>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => copyToClipboard(generatePythonCode())}
                variant="primary"
                size="sm"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                onClick={startEditingPython}
                variant="secondary"
                size="sm"
              >
                Edit Code
              </Button>
            </div>
          </>
        ) : (
          <>
            <textarea
              value={editingPythonString}
              onChange={(e) => setEditingPythonString(e.target.value)}
              className="w-full h-32 bg-gray-800 text-green-400 p-3 rounded font-mono text-sm resize-none"
              placeholder="Enter Python format (shape_1 = [(x, y), (x, y), ...])..."
            />
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => {
                  // Apply changes logic would go here
                  setIsEditingPython(false);
                }}
                variant="primary"
                size="sm"
              >
                Apply Changes
              </Button>
              <Button
                onClick={() => {
                  setIsEditingPython(false);
                  setEditingPythonString('');
                }}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Format: [(x, y), (x, y), ...] - Each line represents one shape as a list of tuples.
            </div>
          </>
        )}
      </div>

      {/* SVG String Format */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-800">SVG String Format</h3>
        {!isEditingSVG ? (
          <>
            <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
              <pre>{generateSVGString()}</pre>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => copyToClipboard(generateSVGString())}
                variant="primary"
                size="sm"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                onClick={startEditingSVG}
                variant="secondary"
                size="sm"
              >
                Edit String
              </Button>
            </div>
          </>
        ) : (
          <>
            <textarea
              value={editingSVGString}
              onChange={(e) => setEditingSVGString(e.target.value)}
              className="w-full h-32 bg-gray-800 text-green-400 p-3 rounded font-mono text-sm resize-none"
              placeholder="Enter SVG string format (x y x y x y)..."
            />
            <div className="flex gap-2 mt-2">
              <Button
                onClick={() => {
                  // Apply changes logic would go here
                  setIsEditingSVG(false);
                }}
                variant="primary"
                size="sm"
              >
                Apply Changes
              </Button>
              <Button
                onClick={() => {
                  setIsEditingSVG(false);
                  setEditingSVGString('');
                }}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Format: Each line represents one shape. Use space-separated x y coordinates.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
