import { useState, useCallback } from 'react';
import { Shape, PolygonShape, Point, DraggedPoint, ShapeStyle } from '../types';
import { createPolygonShape } from '../utils/shapeUtils';
import { createShapeSVG, updateShapeDisplay } from '../utils/shapeRenderer';

export interface UseShapesReturn {
  shapes: Shape[];
  currentShape: Shape | null;
  selectedShape: Shape | null;
  
  // Actions
  addShape: (shape: Shape) => void;
  removeShape: (shape: Shape) => void;
  updateShape: (shapeId: string, updates: Partial<Shape>) => void;
  setCurrentShape: (shape: Shape | null) => void;
  setSelectedShape: (shape: Shape | null) => void;
  clearAllShapes: () => void;
  
  // Shape operations
  startNewPolygon: (point: Point, canvasRef: React.RefObject<HTMLDivElement>) => PolygonShape;
  addPointToShape: (point: Point, isShiftPressed: boolean) => void;
  completeCurrentShape: () => void;
  updateShapePoints: (shapeId: string, newPoints: Point[]) => void;
  updateShapeStyle: (shapeId: string, style: Partial<ShapeStyle>) => void;
  removePoint: (pointData: DraggedPoint) => void;
}

export const useShapes = (): UseShapesReturn => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);

  const addShape = useCallback((shape: Shape) => {
    setShapes(prev => [...prev, shape]);
  }, []);

  const removeShape = useCallback((shape: Shape) => {
    // Remove SVG elements
    if (shape.svg) {
      shape.svg.remove();
    }

    // Remove point elements
    shape.pointElements.forEach(point => {
      point.remove();
    });

    setShapes(prev => prev.filter(s => s.id !== shape.id));
    
    if (currentShape?.id === shape.id) {
      setCurrentShape(null);
    }
    if (selectedShape?.id === shape.id) {
      setSelectedShape(null);
    }
  }, [currentShape, selectedShape]);

  const updateShape = useCallback((shapeId: string, updates: Partial<Shape>) => {
    setShapes(prev => prev.map(shape => {
      if (shape.id === shapeId) {
        const updatedShape = { ...shape, ...updates };
        updateShapeDisplay(updatedShape);
        return updatedShape;
      }
      return shape;
    }));
  }, []);

  const clearAllShapes = useCallback(() => {
    shapes.forEach(shape => removeShape(shape));
    setCurrentShape(null);
    setSelectedShape(null);
  }, [shapes, removeShape]);

  const createPointElement = useCallback((
    x: number, 
    y: number, 
    shape: Shape, 
    index: number,
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
    const newPolygon = createPolygonShape(point, `Polygon ${shapes.length + 1}`);
    
    // Create SVG elements
    const svg = createShapeSVG(newPolygon);
    
    // Add preview line for polygon
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

    // Create point element
    const pointElement = createPointElement(point.x, point.y, newPolygon, 0, canvasRef);
    newPolygon.pointElements.push(pointElement);

    addShape(newPolygon);
    setCurrentShape(newPolygon);
    
    return newPolygon;
  }, [shapes.length, addShape, createPointElement]);

  const addPointToShape = useCallback((point: Point, isShiftPressed: boolean) => {
    if (!currentShape) return;

    let finalPosition = point;
    
    // Apply line straightening if Shift is pressed and we have at least one point
    if (isShiftPressed && currentShape.points.length > 0) {
      const lastPoint = currentShape.points[currentShape.points.length - 1];
      const { straightenLine } = require('../utils/coordinateUtils');
      finalPosition = straightenLine(lastPoint, point);
    }

    const updatedPoints = [...currentShape.points, finalPosition];
    
    // Create point element
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
      removeShape(currentShape);
      setCurrentShape(null);
      return;
    }

    // Remove preview line for polygon
    if (currentShape.type === 'polygon' && 'previewLine' in currentShape) {
      const polygonShape = currentShape as PolygonShape;
      if (polygonShape.previewLine && polygonShape.svg) {
        polygonShape.svg.removeChild(polygonShape.previewLine);
        polygonShape.previewLine = undefined;
      }
    }

    setCurrentShape(null);
  }, [currentShape, removeShape]);

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
    
    if (shape.points.length <= 3) {
      removeShape(shape);
      return;
    }

    const updatedPoints = shape.points.filter((_, i) => i !== index);
    
    // Remove the point element
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
  }, [selectedShape, removeShape, updateShape]);

  return {
    shapes,
    currentShape,
    selectedShape,
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
    removePoint
  };
};
