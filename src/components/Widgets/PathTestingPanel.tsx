import React, { useCallback, useRef } from 'react';
import { ChevronRight, ChevronLeft, X, Download, FileText, Clipboard } from 'lucide-react';
import { PathTestPoint, Shape } from '../../types';
import { exportPathToJSON, exportPathToCSV } from '../../utils/pathParsingUtils';

interface PathTestingPanelProps {
  testPath: PathTestPoint[];
  textContent: string;
  isCollapsed: boolean;
  shapes: Shape[];
  onToggleCollapse: () => void;
  onClearPath: () => void;
  onTextChange: (text: string) => void;
  onPointHover: (index: number | null) => void;
}

const MAX_POINTS = 1000;

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  inside: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  outside: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  edge: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
};

export const PathTestingPanel: React.FC<PathTestingPanelProps> = ({
  testPath,
  textContent,
  isCollapsed,
  shapes,
  onToggleCollapse,
  onClearPath,
  onTextChange,
  onPointHover,
}) => {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validPoints = testPath.filter(p => p.validFormat);
  const insideCount = validPoints.filter(p => p.status === 'inside').length;
  const outsideCount = validPoints.filter(p => p.status === 'outside').length;
  const edgeCount = validPoints.filter(p => p.status === 'edge').length;

  const polygonNames = shapes
    .filter(s => s.type === 'polygon' && s.points.length >= 3)
    .map(s => s.name);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onTextChange(value);
      }, 500);
    },
    [onTextChange]
  );

  const handleExportJSON = useCallback(() => {
    const json = exportPathToJSON(validPoints, shapes);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'path-test.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [validPoints, shapes]);

  const handleExportCSV = useCallback(() => {
    const csv = exportPathToCSV(validPoints, shapes);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'path-test.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [validPoints, shapes]);

  const handleCopyClipboard = useCallback(() => {
    navigator.clipboard.writeText(textContent);
  }, [textContent]);

  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-24 z-40">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1 bg-white shadow-lg rounded-l-lg px-2 py-3 hover:bg-gray-50 transition-colors border border-r-0 border-gray-200"
          title="Expand Path Test Panel"
        >
          <ChevronLeft size={16} className="text-gray-600" />
          <span className="text-xs font-medium text-gray-600 writing-mode-vertical"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            Path Test
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-24 z-40 w-80 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col max-h-[calc(100vh-120px)] transition-all duration-300">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-sm font-semibold text-gray-800">Path Test Results</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onClearPath}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Clear path (C)"
          >
            <X size={14} className="text-gray-500" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Collapse panel"
          >
            <ChevronRight size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium text-gray-600">{validPoints.length} pts</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-emerald-700">{insideCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            <span className="text-red-700">{outsideCount}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
            <span className="text-sky-700">{edgeCount}</span>
          </span>
        </div>
        {validPoints.length >= MAX_POINTS && (
          <div className="text-xs text-amber-600 mt-1 font-medium">
            Maximum of {MAX_POINTS} points reached
          </div>
        )}
      </div>

      {polygonNames.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Polygons:</div>
          <div className="flex flex-wrap gap-1">
            {polygonNames.map((name, i) => (
              <span
                key={i}
                className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0 max-h-72">
          {validPoints.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-gray-400">
              Draw on the canvas to test points
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {validPoints.map((point, i) => {
                const colors = STATUS_COLORS[point.status];
                const shapeMap = new Map(shapes.map(s => [s.id, s.name]));
                const polyNames = point.containingPolygons
                  .map(id => shapeMap.get(id) || id)
                  .join(', ');
                return (
                  <div
                    key={i}
                    className={`px-3 py-1.5 flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-100 transition-colors ${colors.bg}`}
                    onMouseEnter={() => onPointHover(point.index)}
                    onMouseLeave={() => onPointHover(null)}
                  >
                    <span className="text-gray-400 font-mono w-6 text-right">{point.index + 1}</span>
                    <span className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`}></span>
                    <span className="font-mono text-gray-700">
                      {Math.round(point.x)}, {Math.round(point.y)}
                    </span>
                    <span className={`ml-auto flex items-center gap-1.5 flex-shrink-0`}>
                      {polyNames && (
                        <span className={`truncate max-w-[80px] ${colors.text}`} title={polyNames}>
                          {polyNames}
                        </span>
                      )}
                      <span className={`inline-block px-1.5 py-0.5 rounded font-semibold text-[10px] leading-none ${colors.bg} ${colors.text} border ${
                        point.status === 'inside' ? 'border-emerald-200' :
                        point.status === 'edge' ? 'border-sky-200' :
                        'border-red-200'
                      }`}>
                        {point.status === 'inside' ? 'IN' : point.status === 'edge' ? 'EDGE' : 'OUT'}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-3 py-2">
          <div className="text-xs text-gray-500 mb-1">Edit coordinates (x, y per line):</div>
          <textarea
            className="w-full h-24 px-2 py-1.5 text-xs font-mono border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            defaultValue={textContent}
            onChange={handleTextChange}
            placeholder="100, 200&#10;150, 300&#10;..."
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <button
          onClick={handleExportJSON}
          disabled={validPoints.length === 0}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Export as JSON"
        >
          <Download size={12} />
          JSON
        </button>
        <button
          onClick={handleExportCSV}
          disabled={validPoints.length === 0}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Export as CSV"
        >
          <FileText size={12} />
          CSV
        </button>
        <button
          onClick={handleCopyClipboard}
          disabled={validPoints.length === 0}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Copy to clipboard"
        >
          <Clipboard size={12} />
          Copy
        </button>
      </div>
    </div>
  );
};
