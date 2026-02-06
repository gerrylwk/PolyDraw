import { useState, useCallback, useRef } from 'react';
import { Shape, PolygonShape, Point, DraggedPoint, ShapeStyle } from '../types';
import { createPolygonShape } from '../utils/shapeUtils';
import { createShapeSVG, updateShapeDisplay } from '../utils/shapeRenderer';
import { straightenLine } from '../utils/coordinateUtils';
import { useHistory, ShapeSnapshot } from './useHistory';

export interface UseShapesReturn {
  shapes: Shape[];
  currentShape: Shape | null;
  selectedShape: Shape | null;
  canUndo: boolean;
  canRedo: boolean;

  addShape: (shape: Shape) => void;
  removeShape: (shape: Shape) => void;
  updateShape: (shapeId: string, updates: Partial<Shape>) => void;
  setCurrentShape: (shape: Shape | null) => void;
  setSelectedShape: (shape: Shape | null) => void;
  clearAllShapes: () => void;

  startNewPolygon: (point: Point, canvasRef: React.RefObject<HTMLDivElement>) => PolygonShape;
  addPointToShape: (point: Point, isShiftPressed: boolean) => void;
  completeCurrentShape: () => void;
  updateShapePoints: (shapeId: string, newPoints: Point[]) => void;
  updateShapeStyle: (shapeId: string, style: Partial<ShapeStyle>) => void;
  removePoint: (pointData: DraggedPoint) => void;

  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

const destroyShapeDOM = (shape: Shape) => {
  shape.svg?.remove();
  shape.pointElements.forEach(el => el.remove());
};

const serializeShape = (shape: Shape): ShapeSnapshot => ({
  id: shape.id,
  type: shape.type,
  name: shape.name,
  style: { ...shape.style, color: { ...shape.style.color } },
  points: shape.points.map(p => ({ x: p.x, y: p.y })),
  zoneType: shape.zoneType,
});

const rebuildShapeFromSnapshot = (
  snapshot: ShapeSnapshot,
  canvasEl: HTMLDivElement | null
): Shape => {
  const shape = {
    ...snapshot,
    style: { ...snapshot.style, color: { ...snapshot.style.color } },
    points: snapshot.points.map(p => ({ x: p.x, y: p.y })),
    pointElements: [] as HTMLDivElement[],
    element: undefined,
    svg: undefined,
    nameElement: undefined,
  } as Shape;

  const svg = createShapeSVG(shape);
  if (canvasEl) canvasEl.appendChild(svg);

  shape.points.forEach(point => {
    const el = document.createElement('div');
    el.className = 'absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-move z-10 hover:scale-150 transition-transform';
    el.setAttribute('data-point', 'true');
    el.style.left = `${point.x}px`;
    el.style.top = `${point.y}px`;
    if (canvasEl) canvasEl.appendChild(el);
    shape.pointElements.push(el);
  });

  return shape;
};

export const useShapes = (): UseShapesReturn => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const history = useHistory();

  const shapesRef = useRef<Shape[]>([]);
  shapesRef.current = shapes;

  const serializeCurrentShapes = useCallback((): ShapeSnapshot[] => {
    return shapesRef.current.map(serializeShape);
  }, []);

  const saveSnapshot = useCallback(() => {
    history.pushState(serializeCurrentShapes());
  }, [history, serializeCurrentShapes]);

  const rebuildFromSnapshots = useCallback((snapshots: ShapeSnapshot[]) => {
    shapesRef.current.forEach(destroyShapeDOM);
    const canvasEl = document.querySelector('[data-canvas]') as HTMLDivElement;
    const rebuilt = snapshots.map(s => rebuildShapeFromSnapshot(s, canvasEl));
    setShapes(rebuilt);
    setCurrentShape(null);
    setSelectedShape(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (currentShape) return;
    const previous = history.undo(serializeCurrentShapes());
    if (previous) rebuildFromSnapshots(previous);
  }, [currentShape, history, serializeCurrentShapes, rebuildFromSnapshots]);

  const handleRedo = useCallback(() => {
    if (currentShape) return;
    const next = history.redo(serializeCurrentShapes());
    if (next) rebuildFromSnapshots(next);
  }, [currentShape, history, serializeCurrentShapes, rebuildFromSnapshots]);

  const addShape = useCallback((shape: Shape) => {
    setShapes(prev => [...prev, shape]);
  }, []);

  const removeShape = useCallback((shape: Shape) => {
    saveSnapshot();
    destroyShapeDOM(shape);
    setShapes(prev => prev.filter(s => s.id !== shape.id));
    if (currentShape?.id === shape.id) {
      setCurrentShape(null);
    }
    if (selectedShape?.id === shape.id) {
      setSelectedShape(null);
    }
  }, [currentShape, selectedShape, saveSnapshot]);

  const updateShape = useCallback((shapeId: string, updates: Partial<Shape>) => {
    setShapes(prev => prev.map(shape => {
      if (shape.id === shapeId) {
        const updatedShape = { ...shape, ...updates } as Shape;
        updateShapeDisplay(updatedShape);
        return updatedShape;
      }
      return shape;
    }));
  }, []);

  const clearAllShapes = useCallback(() => {
    if (shapesRef.current.length === 0) return;
    saveSnapshot();
    shapesRef.current.forEach(destroyShapeDOM);
    setShapes([]);
    setCurrentShape(null);
    setSelectedShape(null);
  }, [saveSnapshot]);

  const createPointElement = useCallback((
    x: number,
    y: number,
    _shape: Shape,
    _index: number,
    canvasRef: React.RefObject<HTMLDivElement>
  ): HTMLDivElement => {
    const point = document.createElement('div');
    point.className = 'absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-move z-10 hover:scale-150 transition-transform';
    point.setAttribute('data-point', 'true');
    point.style.left = `${x}px`;
    point.style.top = `${y}px`;

    if (canvasRef.current) {
      canvasRef.current.appendChild(point);
    }

    return point;
  }, []);

  const startNewPolygon = useCallback((
    point: Point,
    canvasRef: React.RefObject<HTMLDivElement>
  ): PolygonShape => {
    saveSnapshot();

    const newPolygon = createPolygonShape(point, `Polygon ${shapesRef.current.length + 1}`);

    const svg = createShapeSVG(newPolygon);

    if (newPolygon.type === 'polygon') {
      const previewLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      previewLine.setAttribute('stroke', '#3b82f6');
      previewLine.setAttribute('stroke-width', '2');
      previewLine.setAttribute('stroke-dasharray', '5,5');
      svg.appendChild(previewLine);
      newPolygon.previewLine = previewLine;
    }

    if (canvasRef.current) {
      canvasRef.current.appendChild(svg);
    }

    const pointElement = createPointElement(point.x, point.y, newPolygon, 0, canvasRef);
    newPolygon.pointElements.push(pointElement);

    addShape(newPolygon);
    setCurrentShape(newPolygon);

    return newPolygon;
  }, [saveSnapshot, addShape, createPointElement]);

  const addPointToShape = useCallback((point: Point, isShiftPressed: boolean) => {
    if (!currentShape) return;

    let finalPosition = point;

    if (isShiftPressed && currentShape.points.length > 0) {
      const lastPoint = currentShape.points[currentShape.points.length - 1];
      finalPosition = straightenLine(lastPoint, point);
    }

    const updatedPoints = [...currentShape.points, finalPosition];

    const canvasElement = document.querySelector('[data-canvas]') as HTMLDivElement;
    const pointElement = createPointElement(
      finalPosition.x,
      finalPosition.y,
      currentShape,
      updatedPoints.length - 1,
      { current: canvasElement }
    );

    const updatedShape = {
      ...currentShape,
      points: updatedPoints,
      pointElements: [...currentShape.pointElements, pointElement]
    };

    setShapes(prev => prev.map(s => s.id === updatedShape.id ? updatedShape : s));
    setCurrentShape(updatedShape);
    updateShapeDisplay(updatedShape);
  }, [currentShape, createPointElement]);

  const completeCurrentShape = useCallback(() => {
    if (!currentShape) return;

    if (currentShape.type === 'polygon' && currentShape.points.length < 3) {
      destroyShapeDOM(currentShape);
      setShapes(prev => prev.filter(s => s.id !== currentShape.id));
      setCurrentShape(null);
      return;
    }

    if (currentShape.type === 'polygon' && 'previewLine' in currentShape) {
      const polygonShape = currentShape as PolygonShape;
      if (polygonShape.previewLine && polygonShape.svg) {
        polygonShape.svg.removeChild(polygonShape.previewLine);
        polygonShape.previewLine = undefined;
      }
    }

    setCurrentShape(null);
  }, [currentShape]);

  const updateShapePoints = useCallback((shapeId: string, newPoints: Point[]) => {
    updateShape(shapeId, { points: newPoints });
  }, [updateShape]);

  const updateShapeStyle = useCallback((shapeId: string, style: Partial<ShapeStyle>) => {
    setShapes(prev => prev.map(shape => {
      if (shape.id === shapeId) {
        const updatedShape = { ...shape, style: { ...shape.style, ...style } };
        updateShapeDisplay(updatedShape);
        return updatedShape;
      }
      return shape;
    }));
  }, []);

  const removePoint = useCallback((pointData: DraggedPoint) => {
    const { shape, index } = pointData;

    saveSnapshot();

    if (shape.points.length <= 3) {
      destroyShapeDOM(shape);
      setShapes(prev => prev.filter(s => s.id !== shape.id));
      return;
    }

    const updatedPoints = shape.points.filter((_, i) => i !== index);

    if (shape.pointElements[index]) {
      shape.pointElements[index].remove();
    }

    const updatedPointElements = shape.pointElements.filter((_, i) => i !== index);
    const updatedShape = {
      ...shape,
      points: updatedPoints,
      pointElements: updatedPointElements
    };

    updateShape(shape.id, updatedShape);

    if (selectedShape?.id === shape.id) {
      setSelectedShape(updatedShape);
    }
  }, [selectedShape, saveSnapshot, updateShape]);

  return {
    shapes,
    currentShape,
    selectedShape,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    addShape,
    removeShape,
    updateShape,
    setCurrentShape,
    setSelectedShape,
    clearAllShapes,
    startNewPolygon,
    addPointToShape,
    completeCurrentShape,
    updateShapePoints,
    updateShapeStyle,
    removePoint,
    saveSnapshot,
    undo: handleUndo,
    redo: handleRedo,
  };
};
