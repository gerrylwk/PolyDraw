import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Shape, ImageInfo, CanvasSettings } from '../../types';
import { Button } from '../UI';
import { parsePythonString, parseSVGString, parseYOLOString, copyTextToClipboard } from '../../utils';

export interface ExportWidgetProps {
  shapes: Shape[];
  imageInfo: ImageInfo;
  canvasSettings: CanvasSettings;
  currentOpacity: number;
  onShapesReplace?: (newShapes: Shape[]) => void;
  onClearShapes?: () => void;
}

export const ExportWidget: React.FC<ExportWidgetProps> = ({
  shapes,
  imageInfo,
  canvasSettings,
  currentOpacity,
  onShapesReplace,
  onClearShapes
}) => {
  const [copied, setCopied] = useState(false);
  const [editingSVGString, setEditingSVGString] = useState('');
  const [isEditingSVG, setIsEditingSVG] = useState(false);
  const [editingPythonString, setEditingPythonString] = useState('');
  const [isEditingPython, setIsEditingPython] = useState(false);
  const [editingYOLOString, setEditingYOLOString] = useState('');
  const [isEditingYOLO, setIsEditingYOLO] = useState(false);

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

  const generateYOLOString = (): string => {
    if (shapes.length === 0) return '# No shapes created yet';

    const imgWidth = imageInfo.naturalWidth || 1;
    const imgHeight = imageInfo.naturalHeight || 1;

    let out = '';
    shapes.forEach((shape, index) => {
      if (shape.points.length === 0) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      shape.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });

      const w = maxX - minX;
      const h = maxY - minY;
      const cx = minX + w / 2;
      const cy = minY + h / 2;

      const classId = index;
      const useNorm = canvasSettings.normalize && imageInfo.element;
      out += `# ${shape.name}\n`;
      if (useNorm) {
        out += `${classId} ${(cx / imgWidth).toFixed(6)} ${(cy / imgHeight).toFixed(6)} ${(w / imgWidth).toFixed(6)} ${(h / imgHeight).toFixed(6)}\n\n`;
      } else {
        out += `${classId} ${Math.round(cx)} ${Math.round(cy)} ${Math.round(w)} ${Math.round(h)}\n\n`;
      }
    });

    return out;
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
    const result = await copyTextToClipboard(text);
    if (result.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      console.error('Failed to copy:', result.error);
      alert(`Copy failed: ${result.error || 'Unknown error'}`);
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

  const applyPythonChanges = () => {
    try {
      if (onClearShapes) {
        onClearShapes();
      }
      
      // Parse the new shapes
      const newShapes = parsePythonString(
        editingPythonString, 
        canvasSettings.normalize, 
        imageInfo.element ? imageInfo : undefined,
        currentOpacity
      );
      
      if (onShapesReplace) {
        onShapesReplace(newShapes);
      }
      
      setIsEditingPython(false);
      setEditingPythonString('');
    } catch (error) {
      console.error('Error parsing Python string:', error);
      alert('Error parsing Python string. Please check the format.');
    }
  };

  const startEditingYOLO = () => {
    setEditingYOLOString(generateYOLOString());
    setIsEditingYOLO(true);
  };

  const applyYOLOChanges = () => {
    try {
      if (onClearShapes) {
        onClearShapes();
      }

      const newShapes = parseYOLOString(
        editingYOLOString,
        canvasSettings.normalize,
        imageInfo.element ? imageInfo : undefined,
        currentOpacity
      );

      if (onShapesReplace) {
        onShapesReplace(newShapes);
      }

      setIsEditingYOLO(false);
      setEditingYOLOString('');
    } catch (error) {
      console.error('Error parsing YOLO string:', error);
      alert('Error parsing YOLO string. Please check the format.');
    }
  };

  const applySVGChanges = () => {
    try {
      if (onClearShapes) {
        onClearShapes();
      }
      
      // Parse the new shapes
      const newShapes = parseSVGString(
        editingSVGString, 
        canvasSettings.normalize, 
        imageInfo.element ? imageInfo : undefined,
        currentOpacity
      );
      
      if (onShapesReplace) {
        onShapesReplace(newShapes);
      }
      
      setIsEditingSVG(false);
      setEditingSVGString('');
    } catch (error) {
      console.error('Error parsing SVG string:', error);
      alert('Error parsing SVG string. Please check the format.');
    }
  };

  return (
    <div className="polydraw-export-widget space-y-6" data-testid="export-widget">
      {/* Python Format Export Section */}
      <section className="polydraw-python-export-section">
        <h3 className="polydraw-section-title text-lg font-semibold mb-2 text-gray-800">Python Format</h3>
        {!isEditingPython ? (
          <div className="polydraw-python-display-mode">
            <div className="polydraw-code-display bg-gray-800 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto" data-testid="python-code-display">
              <pre className="polydraw-code-content">{generatePythonCode()}</pre>
            </div>
            <div className="polydraw-python-actions flex gap-2 mt-2">
              <Button
                onClick={() => copyToClipboard(generatePythonCode())}
                variant="primary"
                size="sm"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
                className="polydraw-copy-python-button"
                data-testid="copy-python-button"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                onClick={startEditingPython}
                variant="secondary"
                size="sm"
                className="polydraw-edit-python-button"
                data-testid="edit-python-button"
              >
                Edit Code
              </Button>
            </div>
          </div>
        ) : (
          <div className="polydraw-python-edit-mode">
            <textarea
              value={editingPythonString}
              onChange={(e) => setEditingPythonString(e.target.value)}
              className="polydraw-python-editor w-full h-32 bg-gray-800 text-green-400 p-3 rounded font-mono text-sm resize-none"
              placeholder="Enter Python format (shape_1 = [(x, y), (x, y), ...])..."
              data-testid="python-editor"
            />
            <div className="polydraw-python-edit-actions flex gap-2 mt-2">
              <Button
                onClick={applyPythonChanges}
                variant="primary"
                size="sm"
                className="polydraw-apply-python-button"
                data-testid="apply-python-button"
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
                className="polydraw-cancel-python-button"
                data-testid="cancel-python-button"
              >
                Cancel
              </Button>
            </div>
            <div className="polydraw-python-format-hint text-xs text-gray-500 mt-1">
              Format: [(x, y), (x, y), ...] - Each line represents one shape as a list of tuples.
            </div>
          </div>
        )}
      </section>

      {/* SVG String Format Export Section */}
      <section className="polydraw-svg-export-section">
        <h3 className="polydraw-section-title text-lg font-semibold mb-2 text-gray-800">SVG String Format</h3>
        {!isEditingSVG ? (
          <div className="polydraw-svg-display-mode">
            <div className="polydraw-code-display bg-gray-800 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto" data-testid="svg-code-display">
              <pre className="polydraw-code-content">{generateSVGString()}</pre>
            </div>
            <div className="polydraw-svg-actions flex gap-2 mt-2">
              <Button
                onClick={() => copyToClipboard(generateSVGString())}
                variant="primary"
                size="sm"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
                className="polydraw-copy-svg-button"
                data-testid="copy-svg-button"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                onClick={startEditingSVG}
                variant="secondary"
                size="sm"
                className="polydraw-edit-svg-button"
                data-testid="edit-svg-button"
              >
                Edit String
              </Button>
            </div>
          </div>
        ) : (
          <div className="polydraw-svg-edit-mode">
            <textarea
              value={editingSVGString}
              onChange={(e) => setEditingSVGString(e.target.value)}
              className="polydraw-svg-editor w-full h-32 bg-gray-800 text-green-400 p-3 rounded font-mono text-sm resize-none"
              placeholder="Enter SVG string format (x y x y x y)..."
              data-testid="svg-editor"
            />
            <div className="polydraw-svg-edit-actions flex gap-2 mt-2">
              <Button
                onClick={applySVGChanges}
                variant="primary"
                size="sm"
                className="polydraw-apply-svg-button"
                data-testid="apply-svg-button"
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
                className="polydraw-cancel-svg-button"
                data-testid="cancel-svg-button"
              >
                Cancel
              </Button>
            </div>
            <div className="polydraw-svg-format-hint text-xs text-gray-500 mt-1">
              Format: Each line represents one shape. Use space-separated x y coordinates.
            </div>
          </div>
        )}
      </section>

      {/* YOLO Format Export Section */}
      <section className="polydraw-yolo-export-section">
        <h3 className="polydraw-section-title text-lg font-semibold mb-2 text-gray-800">YOLO Format</h3>
        {!isEditingYOLO ? (
          <div className="polydraw-yolo-display-mode">
            <div className="polydraw-code-display bg-gray-800 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto" data-testid="yolo-code-display">
              <pre className="polydraw-code-content">{generateYOLOString()}</pre>
            </div>
            <div className="polydraw-yolo-actions flex gap-2 mt-2">
              <Button
                onClick={() => copyToClipboard(generateYOLOString())}
                variant="primary"
                size="sm"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
                className="polydraw-copy-yolo-button"
                data-testid="copy-yolo-button"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                onClick={startEditingYOLO}
                variant="secondary"
                size="sm"
                className="polydraw-edit-yolo-button"
                data-testid="edit-yolo-button"
              >
                Edit String
              </Button>
            </div>
            <div className="polydraw-yolo-format-hint text-xs text-gray-500 mt-1">
              Format: <code>class_id center_x center_y width height</code> — axis-aligned bounding box per shape. Class id is the shape index. Honors the Normalize Coordinates toggle.
            </div>
          </div>
        ) : (
          <div className="polydraw-yolo-edit-mode">
            <textarea
              value={editingYOLOString}
              onChange={(e) => setEditingYOLOString(e.target.value)}
              className="polydraw-yolo-editor w-full h-32 bg-gray-800 text-green-400 p-3 rounded font-mono text-sm resize-none"
              placeholder="Enter YOLO format (class_id cx cy w h per line)..."
              data-testid="yolo-editor"
            />
            <div className="polydraw-yolo-edit-actions flex gap-2 mt-2">
              <Button
                onClick={applyYOLOChanges}
                variant="primary"
                size="sm"
                className="polydraw-apply-yolo-button"
                data-testid="apply-yolo-button"
              >
                Apply Changes
              </Button>
              <Button
                onClick={() => {
                  setIsEditingYOLO(false);
                  setEditingYOLOString('');
                }}
                variant="secondary"
                size="sm"
                className="polydraw-cancel-yolo-button"
                data-testid="cancel-yolo-button"
              >
                Cancel
              </Button>
            </div>
            <div className="polydraw-yolo-format-hint text-xs text-gray-500 mt-1">
              Each non-comment line: <code>class_id cx cy w h</code>. Bbox becomes a 4-point polygon. Coordinates are interpreted using the current Normalize Coordinates toggle.
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
