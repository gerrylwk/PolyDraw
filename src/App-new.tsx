import React, { useState, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { 
  ViewControlsWidget, 
  ExportWidget
} from './components/Widgets';
import { 
  useCanvas, 
  useShapes, 
  useTools, 
  useKeyboardShortcuts 
} from './hooks';
import { 
  getMousePosition, 
  findPointAt, 
  straightenLine 
} from './utils';
import { CanvasSettings, Point } from './types';

function App() {
  // Custom hooks for state management
  const canvas = useCanvas();
  const shapes = useShapes();
  const tools = useTools();

  // Local state for canvas settings and opacity
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    snapToEdge: true,
    snapThreshold: 20,
    normalize: false,
    viewType: 'static'
  });
  
  const [polygonOpacity, setPolygonOpacity] = useState(0.2);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    toolState: tools.toolState,
    onDeletePoint: shapes.removePoint,
    onCompleteShape: shapes.completeCurrentShape,
    onShiftChange: tools.setShiftPressed
  });

  // Canvas event handlers with full implementation
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const position = getMousePosition(
      e,
      canvas.canvasContainerRef,
      canvas.canvasState.offsetX,
      canvas.canvasState.offsetY,
      canvas.canvasState.scale,
      canvasSettings.snapToEdge,
      canvas.imageInfo,
      canvasSettings.snapThreshold,
      canvasSettings.viewType
    );

    if (tools.toolState.currentTool === 'polygon') {
      // Check if clicking on the first point to complete polygon
      if (shapes.currentShape && shapes.currentShape.points.length >= 3) {
        const firstPoint = shapes.currentShape.points[0];
        const distance = Math.sqrt(Math.pow(firstPoint.x - position.x, 2) + Math.pow(firstPoint.y - position.y, 2));
        const threshold = 15 / canvas.canvasState.scale;
        
        if (distance <= threshold) {
          shapes.completeCurrentShape();
          return;
        }
      }
      
      if (!shapes.currentShape) {
        shapes.startNewPolygon(position, canvas.canvasRef);
      } else {
        shapes.addPointToShape(position, tools.toolState.isShiftPressed);
      }
    } else if (tools.toolState.currentTool === 'select') {
      const point = findPointAt(position.x, position.y, shapes.shapes, canvas.canvasState.scale);
      if (point) {
        tools.setDraggingPoint(true, point);
        tools.setSelectedPoint(point);
        e.preventDefault();
        return;
      }

      // Start canvas dragging
      canvas.setDragging(true, e.clientX - canvas.canvasState.offsetX, e.clientY - canvas.canvasState.offsetY);
    }
  }, [
    canvas.canvasContainerRef,
    canvas.canvasState,
    canvas.imageInfo,
    canvas.canvasRef,
    canvasSettings,
    tools.toolState,
    shapes.currentShape,
    shapes.shapes,
    shapes.completeCurrentShape,
    shapes.startNewPolygon,
    shapes.addPointToShape,
    tools.setDraggingPoint,
    tools.setSelectedPoint,
    canvas.setDragging
  ]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const position = getMousePosition(
      e,
      canvas.canvasContainerRef,
      canvas.canvasState.offsetX,
      canvas.canvasState.offsetY,
      canvas.canvasState.scale,
      canvasSettings.snapToEdge,
      canvas.imageInfo,
      canvasSettings.snapThreshold,
      canvasSettings.viewType
    );

    if (tools.toolState.isDraggingPoint && tools.draggedPoint) {
      // Update the dragged point
      const updatedPoints = tools.draggedPoint.shape.points.map((point, index) =>
        index === tools.draggedPoint!.index ? position : point
      );

      shapes.updateShapePoints(tools.draggedPoint.shape.id, updatedPoints);
      tools.setDraggingPoint(true, { ...tools.draggedPoint, ...position });
      
      e.preventDefault();
    } else if (canvas.canvasState.isDragging) {
      canvas.setOffset(
        e.clientX - canvas.canvasState.dragStartX,
        e.clientY - canvas.canvasState.dragStartY
      );
      e.preventDefault();
    } else if (tools.toolState.currentTool === 'polygon' && shapes.currentShape) {
      // Update preview line for polygon
      if (shapes.currentShape.type === 'polygon' && 'previewLine' in shapes.currentShape) {
        const polygonShape = shapes.currentShape as any;
        if (polygonShape.previewLine) {
          const lastPoint = shapes.currentShape.points[shapes.currentShape.points.length - 1];
          let previewPosition = position;
          
          // Apply line straightening to preview line if Shift is pressed
          if (tools.toolState.isShiftPressed) {
            previewPosition = straightenLine(lastPoint, position);
          }
          
          polygonShape.previewLine.setAttribute('x1', lastPoint.x.toString());
          polygonShape.previewLine.setAttribute('y1', lastPoint.y.toString());
          polygonShape.previewLine.setAttribute('x2', previewPosition.x.toString());
          polygonShape.previewLine.setAttribute('y2', previewPosition.y.toString());
        }
      }
    }
  }, [
    canvas.canvasContainerRef,
    canvas.canvasState,
    canvas.imageInfo,
    canvas.setOffset,
    canvasSettings,
    tools.toolState,
    tools.draggedPoint,
    tools.setDraggingPoint,
    shapes.currentShape,
    shapes.updateShapePoints
  ]);

  const handleCanvasMouseUp = useCallback(() => {
    if (tools.toolState.isDraggingPoint) {
      tools.setDraggingPoint(false);
    }
    if (canvas.canvasState.isDragging) {
      canvas.setDragging(false);
    }
  }, [tools.toolState.isDraggingPoint, canvas.canvasState.isDragging, tools.setDraggingPoint, canvas.setDragging]);

  // Widget event handlers
  const handleShapeUpdate = useCallback((shapeId: string, updates: any) => {
    shapes.updateShape(shapeId, updates);
  }, [shapes.updateShape]);

  const handlePointUpdate = useCallback((shapeId: string, pointIndex: number, newPoint: Point) => {
    const shape = shapes.shapes.find(s => s.id === shapeId);
    if (shape) {
      const updatedPoints = shape.points.map((p, i) => i === pointIndex ? newPoint : p);
      shapes.updateShapePoints(shapeId, updatedPoints);
    }
  }, [shapes.shapes, shapes.updateShapePoints]);

  const handleCanvasSettingsChange = useCallback((newSettings: Partial<CanvasSettings>) => {
    setCanvasSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleOpacityChange = useCallback((opacity: number) => {
    setPolygonOpacity(opacity);
    // Update all shapes with new opacity
    shapes.shapes.forEach(shape => {
      shapes.updateShapeStyle(shape.id, { opacity });
    });
  }, [shapes.shapes, shapes.updateShapeStyle]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">PolyDraw</h1>
          <p className="text-gray-600">SVG Polygon Editor - Click and drag points, press Delete to remove selected point</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Tools */}
          <div className="w-full lg:w-64 bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Tools</h2>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={React.useRef<HTMLInputElement>(null)}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) canvas.uploadImage(file);
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                      input?.click();
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>Choose File</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">{canvas.imageInfo.fileName}</div>
              </div>

              {/* View Type */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
                <select
                  value={canvasSettings.viewType}
                  onChange={(e) => handleCanvasSettingsChange({ viewType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  <option value="static">Static View</option>
                  <option value="double-panoramic">Double Panoramic View</option>
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  {canvasSettings.viewType === 'static' 
                    ? 'Normal single image view' 
                    : 'Top and bottom halves are separate images'
                  }
                </div>
              </div>

              {/* Drawing Tools */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Drawing Tools</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => tools.setCurrentTool('select')}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded transition-colors ${
                      tools.toolState.currentTool === 'select'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                    </svg>
                    <span>Select</span>
                  </button>
                  <button
                    onClick={() => tools.setCurrentTool('polygon')}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded transition-colors ${
                      tools.toolState.currentTool === 'polygon'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="5,12 19,12"/>
                      <polyline points="12,5 12,19"/>
                    </svg>
                    <span>Polygon</span>
                  </button>
                </div>
              </div>

              {/* View Controls */}
              <ViewControlsWidget
                scale={canvas.canvasState.scale}
                onZoom={canvas.zoom}
                onResetView={canvas.resetView}
                polygonOpacity={polygonOpacity}
                onOpacityChange={handleOpacityChange}
                onClearAll={shapes.clearAllShapes}
              />

              {/* Line Straightening Info */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Line Straightening</label>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${tools.toolState.isShiftPressed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium">
                      {tools.toolState.isShiftPressed ? 'Shift Active' : 'Shift Inactive'}
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

          {/* Main Canvas Area */}
          <div className="flex-1">
            <Canvas
              canvasState={canvas.canvasState}
              imageInfo={canvas.imageInfo}
              viewType={canvasSettings.viewType}
              currentTool={tools.toolState.currentTool}
              shapes={shapes.shapes}
              currentShape={shapes.currentShape}
              draggedPoint={tools.draggedPoint}
              canvasContainerRef={canvas.canvasContainerRef}
              canvasRef={canvas.canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseEnter={() => canvas.setMouseOverCanvas(true)}
              onMouseLeave={() => {
                canvas.setMouseOverCanvas(false);
                handleCanvasMouseUp();
              }}
            />

            {/* Coordinates Panel */}
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Polygon Coordinates</h2>

              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm font-medium text-gray-700">Normalize Coordinates:</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canvasSettings.normalize}
                    onChange={(e) => handleCanvasSettingsChange({ normalize: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm font-medium text-gray-700">Snap to Image Edges:</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canvasSettings.snapToEdge}
                    onChange={(e) => handleCanvasSettingsChange({ snapToEdge: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {canvasSettings.snapToEdge && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Snap Distance: {canvasSettings.snapThreshold}px
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={canvasSettings.snapThreshold}
                    onChange={(e) => handleCanvasSettingsChange({ snapThreshold: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5px</span>
                    <span>50px</span>
                  </div>
                </div>
              )}

              {/* Export Widgets */}
              <ExportWidget
                shapes={shapes.shapes}
                imageInfo={canvas.imageInfo}
                canvasSettings={canvasSettings}
              />

              {/* Edit Coordinates Section with Color Controls */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Edit Coordinates</h3>
                <div className="coordinates-panel bg-gray-50 rounded p-3 max-h-60 overflow-y-auto">
                  {shapes.shapes.length === 0 ? (
                    <p className="text-gray-500 text-sm">No polygons created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {shapes.shapes.map((shape) => (
                        <div key={shape.id} className="border-b border-gray-200 pb-3 mb-3 last:border-b-0">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                              </label>
                              <input
                                type="text"
                                value={shape.name}
                                onChange={(e) => handleShapeUpdate(shape.id, { name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Color (RGB)
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Red</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="255"
                                    value={shape.style.color.r}
                                    onChange={(e) => shapes.updateShapeStyle(shape.id, {
                                      color: {
                                        ...shape.style.color,
                                        r: Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                                      }
                                    })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Green</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="255"
                                    value={shape.style.color.g}
                                    onChange={(e) => shapes.updateShapeStyle(shape.id, {
                                      color: {
                                        ...shape.style.color,
                                        g: Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                                      }
                                    })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Blue</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="255"
                                    value={shape.style.color.b}
                                    onChange={(e) => shapes.updateShapeStyle(shape.id, {
                                      color: {
                                        ...shape.style.color,
                                        b: Math.max(0, Math.min(255, parseInt(e.target.value) || 0))
                                      }
                                    })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <div 
                                className="mt-2 h-6 rounded border border-gray-300"
                                style={{ backgroundColor: `rgb(${shape.style.color.r}, ${shape.style.color.g}, ${shape.style.color.b})` }}
                              />
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <button
                                onClick={() => shapes.removeShape(shape)}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-all duration-200 hover:scale-110"
                                title="Delete polygon"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6"/>
                                  <path d="M19,6V20a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6"/>
                                  <path d="M8,6V4a2 2 0 0 1 2,2h4a2 2 0 0 1 2,2V6"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {shape.points.map((point, pointIndex) => (
                              <div key={pointIndex} className="bg-gray-100 px-2 py-2 rounded flex items-center gap-2">
                                <span className="font-mono text-xs min-w-[50px]">P{pointIndex + 1}:</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">X:</span>
                                  <input
                                    type="number"
                                    value={Math.round(point.x)}
                                    onChange={(e) => {
                                      const newValue = parseFloat(e.target.value) || 0;
                                      handlePointUpdate(shape.id, pointIndex, { ...point, x: newValue });
                                    }}
                                    className="w-16 px-1 py-0.5 text-xs border rounded"
                                    step="1"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Y:</span>
                                  <input
                                    type="number"
                                    value={Math.round(point.y)}
                                    onChange={(e) => {
                                      const newValue = parseFloat(e.target.value) || 0;
                                      handlePointUpdate(shape.id, pointIndex, { ...point, y: newValue });
                                    }}
                                    className="w-16 px-1 py-0.5 text-xs border rounded"
                                    step="1"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
