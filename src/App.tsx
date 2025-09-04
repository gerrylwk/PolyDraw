import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, MousePointer, Move, ZoomIn, ZoomOut, Maximize, Trash2, Copy, Check } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Polygon {
  id: number;
  name: string;
  points: Point[];
  element?: SVGPolygonElement;
  svg?: SVGSVGElement;
  previewLine?: SVGLineElement;
  pointElements: HTMLDivElement[];
  nameElement?: SVGTextElement;
}

interface DraggedPoint {
  x: number;
  y: number;
  index: number;
  polygon: Polygon;
}

type ViewType = 'static' | 'double-panoramic';

function App() {
  // State variables
  const [currentTool, setCurrentTool] = useState<'select' | 'polygon'>('polygon');
  const [currentPolygon, setCurrentPolygon] = useState<Polygon | null>(null);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [isDraggingPoint, setIsDraggingPoint] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState<DraggedPoint | null>(null);
  const [selectedPolygon, setSelectedPolygon] = useState<Polygon | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<DraggedPoint | null>(null);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('No file selected');
  const [normalize, setNormalize] = useState(false);
  const [copied, setCopied] = useState(false);
  const [snapToEdge, setSnapToEdge] = useState(true);
  const [snapThreshold, setSnapThreshold] = useState(20);
  const [polygonOpacity, setPolygonOpacity] = useState(0.2);
  const [editingSVGString, setEditingSVGString] = useState('');
  const [isEditingSVG, setIsEditingSVG] = useState(false);
  const [editingPythonString, setEditingPythonString] = useState('');
  const [isEditingPython, setIsEditingPython] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('static');
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);

  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePolygonPoints = useCallback((polygon: Polygon) => {
    if (!polygon.element) return;

    const pointsStr = polygon.points.map(p => `${p.x},${p.y}`).join(' ');
    polygon.element.setAttribute('points', pointsStr);
    polygon.element.setAttribute('fill-opacity', polygonOpacity.toString());

    polygon.points.forEach((point, index) => {
      if (polygon.pointElements[index]) {
        polygon.pointElements[index].style.left = `${point.x}px`;
        polygon.pointElements[index].style.top = `${point.y}px`;
      }
    });

    if (polygon.nameElement && polygon.points.length > 0) {
      const firstPoint = polygon.points[0];
      polygon.nameElement.setAttribute('x', firstPoint.x.toString());
      polygon.nameElement.setAttribute('y', (firstPoint.y - 15).toString());
      polygon.nameElement.textContent = polygon.name;
    }
  }, [polygonOpacity]);

  const removePolygon = useCallback((polygon: Polygon) => {
    if (polygon.svg && canvasRef.current) {
      canvasRef.current.removeChild(polygon.svg);
    }

    polygon.pointElements.forEach(point => {
      if (point.parentNode && canvasRef.current) {
        canvasRef.current.removeChild(point);
      }
    });

    setPolygons(prev => prev.filter(p => p.id !== polygon.id));
    
    if (currentPolygon?.id === polygon.id) {
      setCurrentPolygon(null);
    }
    if (selectedPolygon?.id === polygon.id) {
      setSelectedPolygon(null);
    }
  }, [currentPolygon, selectedPolygon]);

  const completePolygon = useCallback(() => {
    if (!currentPolygon || currentPolygon.points.length < 3) {
      if (currentPolygon) {
        removePolygon(currentPolygon);
      }
      setCurrentPolygon(null);
      return;
    }

    if (currentPolygon.previewLine && currentPolygon.svg) {
      currentPolygon.svg.removeChild(currentPolygon.previewLine);
      currentPolygon.previewLine = undefined;
    }

    setCurrentPolygon(null);
  }, [currentPolygon, removePolygon]);

  const removePoint = useCallback((pointData: DraggedPoint) => {
    const { polygon, index } = pointData;
    
    if (polygon.points.length <= 3) {
      removePolygon(polygon);
      return;
    }

    const updatedPoints = polygon.points.filter((_, i) => i !== index);
    
    // Remove the point element
    if (polygon.pointElements[index]) {
      canvasRef.current?.removeChild(polygon.pointElements[index]);
    }

    const updatedPointElements = polygon.pointElements.filter((_, i) => i !== index);

    const updatedPolygon = {
      ...polygon,
      points: updatedPoints,
      pointElements: updatedPointElements
    };

    setPolygons(prev => prev.map(p => p.id === polygon.id ? updatedPolygon : p));
    updatePolygonPoints(updatedPolygon);
    
    if (selectedPolygon?.id === polygon.id) {
      setSelectedPolygon(updatedPolygon);
    }
  }, [selectedPolygon, removePolygon, updatePolygonPoints]);

  // Handle keyboard events for delete and escape functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
      if (e.key === 'Delete' && selectedPoint && currentTool === 'select') {
        e.preventDefault();
        removePoint(selectedPoint);
        setSelectedPoint(null);
      } else if (e.key === 'Escape' && currentPolygon) {
        e.preventDefault();
        completePolygon();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedPoint, currentPolygon, currentTool, completePolygon, removePoint]);

  const updateCanvasTransform = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }
  }, [offsetX, offsetY, scale]);

  useEffect(() => {
    updateCanvasTransform();
  }, [updateCanvasTransform]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (uploadedImage && canvasRef.current) {
        canvasRef.current.removeChild(uploadedImage);
      }

      const img = new Image();
      img.src = event.target?.result as string;
      img.className = 'max-w-none';
      img.onload = () => {
        resetCanvasView(img);
      };

      if (canvasRef.current) {
        canvasRef.current.appendChild(img);
      }
      setUploadedImage(img);
    };
    reader.readAsDataURL(file);
  };

  const resetCanvasView = (img?: HTMLImageElement) => {
    const image = img || uploadedImage;
    if (!image || !canvasContainerRef.current) return;

    const containerWidth = canvasContainerRef.current.clientWidth;
    const containerHeight = canvasContainerRef.current.clientHeight;
    const imgWidth = image.naturalWidth;
    const imgHeight = image.naturalHeight;

    const scaleX = containerWidth / imgWidth;
    const scaleY = containerHeight / imgHeight;
    const newScale = Math.min(scaleX, scaleY);

    setScale(newScale);
    setOffsetX((containerWidth - imgWidth * newScale) / 2);
    setOffsetY((containerHeight - imgHeight * newScale) / 2);
  };

  const zoom = (factor: number) => {
    setScale(prev => Math.max(0.1, Math.min(prev * factor, 10)));
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    // Only zoom if mouse is over canvas
    if (!isMouseOverCanvas) return;

    e.preventDefault();

    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const canvasX = (mouseX - offsetX) / scale;
    const canvasY = (mouseY - offsetY) / scale;

    const delta = -Math.sign(e.deltaY);
    const zoomFactor = delta > 0 ? 1.1 : 0.9;
    
    const newScale = Math.max(0.1, Math.min(scale * zoomFactor, 10));
    setScale(newScale);
    setOffsetX(mouseX - canvasX * newScale);
    setOffsetY(mouseY - canvasY * newScale);
  }, [isMouseOverCanvas, offsetX, offsetY, scale]);

  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    // Attach to document to catch all wheel events
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const getMousePosition = (e: React.MouseEvent) => {
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const rawPosition = {
      x: (e.clientX - rect.left - offsetX) / scale,
      y: (e.clientY - rect.top - offsetY) / scale
    };

    // Apply snapping if enabled and image is loaded
    if (snapToEdge && uploadedImage) {
      return snapToImageEdges(rawPosition);
    }

    return rawPosition;
  };

  const snapToImageEdges = (position: { x: number; y: number }) => {
    if (!uploadedImage) return position;

    const imgWidth = uploadedImage.naturalWidth;
    const imgHeight = uploadedImage.naturalHeight;
    const threshold = snapThreshold / scale; // Adjust threshold based on zoom level

    let { x, y } = position;

    // Snap to left edge
    if (Math.abs(x - 0) <= threshold) {
      x = 0;
    }
    // Snap to right edge
    else if (Math.abs(x - imgWidth) <= threshold) {
      x = imgWidth;
    }

    // Handle vertical snapping based on view type
    if (viewType === 'static') {
      // Snap to top edge
      if (Math.abs(y - 0) <= threshold) {
        y = 0;
      }
      // Snap to bottom edge
      else if (Math.abs(y - imgHeight) <= threshold) {
        y = imgHeight;
      }
    } else if (viewType === 'double-panoramic') {
      const midPoint = imgHeight / 2;
      
      // Determine which half we're in
      if (y <= midPoint) {
        // Top half - snap to top edge or middle boundary
        if (Math.abs(y - 0) <= threshold) {
          y = 0;
        } else if (Math.abs(y - midPoint) <= threshold) {
          y = midPoint;
        }
        // Constrain to top half
        if (y > midPoint) {
          y = midPoint;
        }
      } else {
        // Bottom half - snap to middle boundary + 1 or bottom edge
        if (Math.abs(y - midPoint) <= threshold) {
          y = midPoint + 1;
        } else if (Math.abs(y - imgHeight) <= threshold) {
          y = imgHeight;
        }
        // Constrain to bottom half
        if (y < midPoint) {
          y = midPoint;
        }
      }
    }

    return { x, y };
  };

  const findPointAt = (x: number, y: number): DraggedPoint | null => {
    const threshold = 15 / scale;

    for (const polygon of polygons) {
      for (let i = 0; i < polygon.points.length; i++) {
        const point = polygon.points[i];
        const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));

        if (distance <= threshold) {
          return {
            x: point.x,
            y: point.y,
            index: i,
            polygon: polygon
          };
        }
      }
    }

    return null;
  };

  const createPointElement = (x: number, y: number, polygon: Polygon, index: number): HTMLDivElement => {
    const point = document.createElement('div');
    point.className = 'absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-move z-10 hover:scale-150 transition-transform';
    point.setAttribute('data-point', 'true');
    point.style.left = `${x}px`;
    point.style.top = `${y}px`;

    // Add click handler for selection
    point.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentTool === 'select') {
        const pointData = {
          x: polygon.points[index].x,
          y: polygon.points[index].y,
          index,
          polygon
        };
        setSelectedPoint(pointData);
        
        // Visual feedback for selected point
        document.querySelectorAll('[data-point]').forEach(p => p.classList.remove('ring-2', 'ring-red-400'));
        point.classList.add('ring-2', 'ring-red-400');
      } else if (currentTool === 'polygon' && currentPolygon === polygon && index === 0 && currentPolygon.points.length >= 3) {
        completePolygon();
      }
    });

    if (canvasRef.current) {
      canvasRef.current.appendChild(point);
    }
    
    return point;
  };

  const startNewPolygon = (x: number, y: number) => {
    const newPolygon: Polygon = {
      id: Date.now(),
      name: `Polygon ${polygons.length + 1}`,
      points: [{ x, y }],
      pointElements: []
    };

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('class', 'absolute top-0 left-0 w-full h-full pointer-events-none');
    svg.style.transformOrigin = '0 0';

    const polygonElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygonElement.setAttribute('class', 'fill-blue-500 stroke-blue-500 stroke-2');
    polygonElement.setAttribute('fill-opacity', polygonOpacity.toString());
    polygonElement.style.vectorEffect = 'non-scaling-stroke';

    const previewLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    previewLine.setAttribute('stroke', '#3b82f6');
    previewLine.setAttribute('stroke-width', '2');
    previewLine.setAttribute('stroke-dasharray', '5,5');

    const nameElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    nameElement.setAttribute('class', 'polygon-name');
    nameElement.setAttribute('fill', '#3b82f6');
    nameElement.setAttribute('font-size', '12');
    nameElement.setAttribute('font-weight', 'bold');
    nameElement.setAttribute('x', x.toString());
    nameElement.setAttribute('y', (y - 15).toString());
    nameElement.textContent = newPolygon.name;

    svg.appendChild(polygonElement);
    svg.appendChild(previewLine);
    svg.appendChild(nameElement);

    if (canvasRef.current) {
      canvasRef.current.appendChild(svg);
    }

    newPolygon.element = polygonElement;
    newPolygon.svg = svg;
    newPolygon.previewLine = previewLine;
    newPolygon.nameElement = nameElement;

    const pointElement = createPointElement(x, y, newPolygon, 0);
    newPolygon.pointElements.push(pointElement);

    updatePolygonPoints(newPolygon);
    setPolygons(prev => [...prev, newPolygon]);
    setCurrentPolygon(newPolygon);
  };

  const addPointToPolygon = (x: number, y: number) => {
    if (!currentPolygon) return;

    let finalPosition = { x, y };
    
    // Apply line straightening if Shift is pressed and we have at least one point
    if (isShiftPressed && currentPolygon.points.length > 0) {
      const lastPoint = currentPolygon.points[currentPolygon.points.length - 1];
      finalPosition = straightenLine(lastPoint, { x, y });
    }

    const updatedPolygon = {
      ...currentPolygon,
      points: [...currentPolygon.points, finalPosition]
    };

    const pointElement = createPointElement(finalPosition.x, finalPosition.y, updatedPolygon, updatedPolygon.points.length - 1);
    updatedPolygon.pointElements.push(pointElement);

    setPolygons(prev => prev.map(p => p.id === updatedPolygon.id ? updatedPolygon : p));
    setCurrentPolygon(updatedPolygon);
    updatePolygonPoints(updatedPolygon);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const { x, y } = getMousePosition(e);

    if (currentTool === 'polygon') {
      // Check if clicking on the first point to complete polygon
      if (currentPolygon && currentPolygon.points.length >= 3) {
        const firstPoint = currentPolygon.points[0];
        const distance = Math.sqrt(Math.pow(firstPoint.x - x, 2) + Math.pow(firstPoint.y - y, 2));
        const threshold = 15 / scale;
        
        if (distance <= threshold) {
          completePolygon();
          return;
        }
      }
      
      if (!currentPolygon) {
        startNewPolygon(x, y);
      } else {
        addPointToPolygon(x, y);
      }
    } else if (currentTool === 'select') {
      const point = findPointAt(x, y);
      if (point) {
        setIsDraggingPoint(true);
        setDraggedPoint(point);
        setSelectedPoint(point);
        
        // Visual feedback
        document.querySelectorAll('[data-point]').forEach(p => p.classList.remove('ring-2', 'ring-red-400'));
        if (point.polygon.pointElements[point.index]) {
          point.polygon.pointElements[point.index].classList.add('ring-2', 'ring-red-400');
        }
        
        e.preventDefault();
        return;
      }

      // Start canvas dragging
      setIsDragging(true);
      setDragStartX(e.clientX - offsetX);
      setDragStartY(e.clientY - offsetY);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getMousePosition(e);

    if (isDraggingPoint && draggedPoint) {
      // Update the dragged point
      const snappedPosition = snapToEdge && uploadedImage ? snapToImageEdges({ x, y }) : { x, y };
      const updatedPolygon = {
        ...draggedPoint.polygon,
        points: draggedPoint.polygon.points.map((point, index) =>
          index === draggedPoint.index ? snappedPosition : point
        )
      };

      setPolygons(prev => prev.map(p => p.id === updatedPolygon.id ? updatedPolygon : p));
      setDraggedPoint({ ...draggedPoint, x: snappedPosition.x, y: snappedPosition.y, polygon: updatedPolygon });
      updatePolygonPoints(updatedPolygon);
      
      e.preventDefault();
    } else if (isDragging) {
      setOffsetX(e.clientX - dragStartX);
      setOffsetY(e.clientY - dragStartY);
      e.preventDefault();
    } else if (currentTool === 'polygon' && currentPolygon && currentPolygon.previewLine) {
      const lastPoint = currentPolygon.points[currentPolygon.points.length - 1];
      let previewPosition = { x, y };
      
      // Apply line straightening to preview line if Shift is pressed
      if (isShiftPressed) {
        previewPosition = straightenLine(lastPoint, { x, y });
      }
      
      currentPolygon.previewLine.setAttribute('x1', lastPoint.x.toString());
      currentPolygon.previewLine.setAttribute('y1', lastPoint.y.toString());
      currentPolygon.previewLine.setAttribute('x2', previewPosition.x.toString());
      currentPolygon.previewLine.setAttribute('y2', previewPosition.y.toString());
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDraggingPoint) {
      setIsDraggingPoint(false);
      setDraggedPoint(null);
    }
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const clearAllPolygons = () => {
    polygons.forEach(polygon => removePolygon(polygon));
    setCurrentPolygon(null);
    setSelectedPolygon(null);
    setSelectedPoint(null);
  };

  const updateAllPolygonOpacity = (opacity: number) => {
    polygons.forEach(polygon => {
      if (polygon.element) {
        polygon.element.setAttribute('fill-opacity', opacity.toString());
      }
    });
  };

  const handleOpacityChange = (newOpacity: number) => {
    setPolygonOpacity(newOpacity);
    updateAllPolygonOpacity(newOpacity);
  };

  const generatePythonCode = () => {
    if (polygons.length === 0) return '# No polygons created yet';

    const imgWidth = uploadedImage?.naturalWidth || 1;
    const imgHeight = uploadedImage?.naturalHeight || 1;

    let code = '';
    polygons.forEach((polygon, index) => {
      code += `# ${polygon.name}\n`;
      code += `polygon_${index + 1} = [`;

      const points = polygon.points.map(point => {
        if (normalize && uploadedImage) {
          return `(${(point.x / imgWidth).toFixed(4)}, ${(point.y / imgHeight).toFixed(4)})`;
        }
        return `(${Math.round(point.x)}, ${Math.round(point.y)})`;
      });
      code += points.join(', ');
      code += ']\n\n';
    });

    return code;
  };

  const generateSVGString = () => {
    if (polygons.length === 0) return '# No polygons created yet';

    const imgWidth = uploadedImage?.naturalWidth || 1;
    const imgHeight = uploadedImage?.naturalHeight || 1;

    let svgString = '';
    polygons.forEach((polygon) => {
      svgString += `# ${polygon.name}\n`;
      
      const points = polygon.points.map(point => {
        if (normalize && uploadedImage) {
          return `${(point.x / imgWidth).toFixed(4)} ${(point.y / imgHeight).toFixed(4)}`;
        }
        return `${Math.round(point.x)} ${Math.round(point.y)}`;
      });

      svgString += points.join(' ');
      svgString += '\n\n';
    });

    return svgString;
  };

  const parsePythonString = (pythonString: string) => {
    const lines = pythonString.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#');
    });
    const newPolygons: Polygon[] = [];
    
    lines.forEach((line, index) => {
      // Match Python list format: [(x, y), (x, y), ...] or with assignment
      const listMatch = line.match(/(?:=\s*)?\[(.*)\]/);
      if (listMatch) {
        const coordsString = listMatch[1];
        // Extract coordinate pairs from the string
        const coordMatches = coordsString.match(/\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g);
        
        if (coordMatches && coordMatches.length >= 3) { // At least 3 points
          const points: Point[] = [];
          
          coordMatches.forEach(coordMatch => {
            const coordPair = coordMatch.match(/\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
            if (coordPair) {
              let x = parseFloat(coordPair[1]);
              let y = parseFloat(coordPair[2]);
              
              // If coordinates are normalized, convert back to pixel coordinates
              if (normalize && uploadedImage) {
                x = x * uploadedImage.naturalWidth;
                y = y * uploadedImage.naturalHeight;
              }
              
              points.push({ x, y });
            }
          });
          
          if (points.length >= 3) {
            const newPolygon: Polygon = {
              id: Date.now() + index,
              name: `Polygon ${index + 1}`,
              points,
              pointElements: []
            };
            
            newPolygons.push(newPolygon);
          }
        }
      }
    });
    
    return newPolygons;
  };

  const parseSVGString = (svgString: string) => {
    const lines = svgString.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    const newPolygons: Polygon[] = [];
    
    lines.forEach((line, index) => {
      const coords = line.trim().split(/\s+/).map(coord => parseFloat(coord)).filter(num => !isNaN(num));
      
      if (coords.length >= 6 && coords.length % 2 === 0) { // At least 3 points (6 coordinates)
        const points: Point[] = [];
        for (let i = 0; i < coords.length; i += 2) {
          let x = coords[i];
          let y = coords[i + 1];
          
          // If coordinates are normalized, convert back to pixel coordinates
          if (normalize && uploadedImage) {
            x = x * uploadedImage.naturalWidth;
            y = y * uploadedImage.naturalHeight;
          }
          
          points.push({ x, y });
        }
        
        const newPolygon: Polygon = {
          id: Date.now() + index,
          name: `Polygon ${index + 1}`,
          points,
          pointElements: []
        };
        
        newPolygons.push(newPolygon);
      }
    });
    
    return newPolygons;
  };

  const applyPythonStringEdit = () => {
    try {
      // Clear existing polygons
      polygons.forEach(polygon => removePolygon(polygon));
      
      // Parse and create new polygons
      const newPolygons = parsePythonString(editingPythonString);
      
      newPolygons.forEach(polygon => {
        // Create SVG elements
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'absolute top-0 left-0 w-full h-full pointer-events-none');
        svg.style.transformOrigin = '0 0';

        const polygonElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygonElement.setAttribute('class', 'fill-blue-500 stroke-blue-500 stroke-2');
        polygonElement.setAttribute('fill-opacity', polygonOpacity.toString());
        polygonElement.style.vectorEffect = 'non-scaling-stroke';

        const nameElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nameElement.setAttribute('class', 'polygon-name');
        nameElement.setAttribute('fill', '#3b82f6');
        nameElement.setAttribute('font-size', '12');
        nameElement.setAttribute('font-weight', 'bold');
        nameElement.setAttribute('x', polygon.points[0].x.toString());
        nameElement.setAttribute('y', (polygon.points[0].y - 15).toString());
        nameElement.textContent = polygon.name;

        svg.appendChild(polygonElement);
        svg.appendChild(nameElement);

        if (canvasRef.current) {
          canvasRef.current.appendChild(svg);
        }

        polygon.element = polygonElement;
        polygon.svg = svg;
        polygon.nameElement = nameElement;

        // Create point elements
        polygon.points.forEach((point, index) => {
          const pointElement = createPointElement(point.x, point.y, polygon, index);
          polygon.pointElements.push(pointElement);
        });

        updatePolygonPoints(polygon);
      });
      
      setPolygons(newPolygons);
      setIsEditingPython(false);
    } catch (error) {
      console.error('Error parsing Python string:', error);
      alert('Error parsing Python string. Please check the format.');
    }
  };

  const applySVGStringEdit = () => {
    try {
      // Clear existing polygons
      polygons.forEach(polygon => removePolygon(polygon));
      
      // Parse and create new polygons
      const newPolygons = parseSVGString(editingSVGString);
      
      newPolygons.forEach(polygon => {
        // Create SVG elements
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute('class', 'absolute top-0 left-0 w-full h-full pointer-events-none');
        svg.style.transformOrigin = '0 0';

        const polygonElement = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygonElement.setAttribute('class', 'fill-blue-500 stroke-blue-500 stroke-2');
        polygonElement.setAttribute('fill-opacity', polygonOpacity.toString());
        polygonElement.style.vectorEffect = 'non-scaling-stroke';

        const nameElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
        nameElement.setAttribute('class', 'polygon-name');
        nameElement.setAttribute('fill', '#3b82f6');
        nameElement.setAttribute('font-size', '12');
        nameElement.setAttribute('font-weight', 'bold');
        nameElement.setAttribute('x', polygon.points[0].x.toString());
        nameElement.setAttribute('y', (polygon.points[0].y - 15).toString());
        nameElement.textContent = polygon.name;

        svg.appendChild(polygonElement);
        svg.appendChild(nameElement);

        if (canvasRef.current) {
          canvasRef.current.appendChild(svg);
        }

        polygon.element = polygonElement;
        polygon.svg = svg;
        polygon.nameElement = nameElement;

        // Create point elements
        polygon.points.forEach((point, index) => {
          const pointElement = createPointElement(point.x, point.y, polygon, index);
          polygon.pointElements.push(pointElement);
        });

        updatePolygonPoints(polygon);
      });
      
      setPolygons(newPolygons);
      setIsEditingSVG(false);
    } catch (error) {
      console.error('Error parsing SVG string:', error);
      alert('Error parsing SVG string. Please check the format.');
    }
  };

  const startEditingSVG = () => {
    setEditingSVGString(generateSVGString());
    setIsEditingSVG(true);
  };

  const cancelEditingSVG = () => {
    setIsEditingSVG(false);
    setEditingSVGString('');
  };

  const startEditingPython = () => {
    setEditingPythonString(generatePythonCode());
    setIsEditingPython(true);
  };

  const cancelEditingPython = () => {
    setIsEditingPython(false);
    setEditingPythonString('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatePythonCode());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copySVGToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateSVGString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const straightenLine = (startPoint: Point, endPoint: Point): Point => {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    
    // Calculate angles for horizontal, vertical, and 45-degree lines
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Normalize angle to 0-360 range
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    // Define snap angles and their tolerances
    const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315];
    const tolerance = 22.5; // 22.5 degrees tolerance for snapping
    
    // Find the closest snap angle
    let closestAngle = normalizedAngle;
    let minDifference = Infinity;
    
    for (const snapAngle of snapAngles) {
      const difference = Math.min(
        Math.abs(normalizedAngle - snapAngle),
        Math.abs(normalizedAngle - snapAngle + 360),
        Math.abs(normalizedAngle - snapAngle - 360)
      );
      
      if (difference < tolerance && difference < minDifference) {
        minDifference = difference;
        closestAngle = snapAngle;
      }
    }
    
    // Calculate the distance from start to end point
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Convert the closest angle back to radians and calculate new end point
    const radians = closestAngle * (Math.PI / 180);
    
    return {
      x: startPoint.x + Math.cos(radians) * distance,
      y: startPoint.y + Math.sin(radians) * distance
    };
  };

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload size={16} />
                    <span>Choose File</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">{fileName}</div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">View Type</label>
                <select
                  value={viewType}
                  onChange={(e) => setViewType(e.target.value as ViewType)}
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

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Drawing Tools</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCurrentTool('select')}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded transition-colors ${
                      currentTool === 'select'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    <MousePointer size={16} />
                    <span>Select</span>
                  </button>
                  <button
                    onClick={() => setCurrentTool('polygon')}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded transition-colors ${
                      currentTool === 'polygon'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    <Move size={16} />
                    <span>Polygon</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">View Controls</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => zoom(1.2)}
                    className="flex items-center justify-center py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={() => zoom(0.8)}
                    className="flex items-center justify-center py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button
                    onClick={() => resetCanvasView()}
                    className="flex items-center justify-center py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                  >
                    <Maximize size={16} />
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <div>Zoom: {Math.round(scale * 100)}%</div>
                  <div>Or use mouse wheel</div>
                </div>
              </div>

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

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Polygon Opacity: {Math.round(polygonOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={polygonOpacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={clearAllPolygons}
                  className="w-full py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Canvas Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div
                ref={canvasContainerRef}
                className={`relative w-full h-96 lg:h-[600px] overflow-hidden bg-gray-50 bg-grid-pattern ${
                  viewType === 'double-panoramic' ? 'border-dashed' : ''
                }`}
                style={{
                  backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  touchAction: 'none'
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseEnter={() => setIsMouseOverCanvas(true)}
                onMouseLeave={() => {
                  setIsMouseOverCanvas(false);
                  handleCanvasMouseUp();
                }}
              >
                <div
                  ref={canvasRef}
                  className={`absolute transform-gpu origin-top-left ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{
                    cursor: currentTool === 'polygon' ? 'crosshair' : isDragging ? 'grabbing' : 'grab'
                  }}
                >
                  {/* Double panoramic view divider line */}
                  {viewType === 'double-panoramic' && uploadedImage && (
                    <div
                      className="absolute left-0 right-0 border-t-2 border-dashed border-red-400 pointer-events-none z-20"
                      style={{
                        top: `${uploadedImage.naturalHeight / 2}px`,
                        opacity: 0.7
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Coordinates Panel */}
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Polygon Coordinates</h2>

              <div className="flex items-center gap-2 mb-3">
                <label className="text-sm font-medium text-gray-700">Normalize Coordinates:</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={normalize}
                    onChange={(e) => setNormalize(e.target.checked)}
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
                    checked={snapToEdge}
                    onChange={(e) => setSnapToEdge(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {snapToEdge && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Snap Distance: {snapThreshold}px
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={snapThreshold}
                    onChange={(e) => setSnapThreshold(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5px</span>
                    <span>50px</span>
                  </div>
                </div>
              )}

              <div className="coordinates-panel bg-gray-50 rounded p-3 max-h-60 overflow-y-auto">
                {polygons.length === 0 ? (
                  <p className="text-gray-500 text-sm">No polygons created yet</p>
                ) : (
                  <div className="space-y-2">
                    {polygons.map((polygon) => (
                      <div key={polygon.id} className="border-b border-gray-200 pb-2 mb-2">
                        <div className="font-medium text-gray-700 mb-1 flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={polygon.name}
                            onChange={(e) => {
                              const updatedPolygon = { ...polygon, name: e.target.value };
                              setPolygons(prev => prev.map(p => p.id === polygon.id ? updatedPolygon : p));
                              if (updatedPolygon.nameElement) {
                                updatedPolygon.nameElement.textContent = e.target.value;
                              }
                            }}
                            className="text-sm border rounded px-2 py-1 flex-1"
                          />
                          <button
                            onClick={() => removePolygon(polygon)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-all duration-200 hover:scale-110"
                            title="Delete polygon"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Python Format</h3>
                {!isEditingPython ? (
                  <>
                    <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                      <pre>{generatePythonCode()}</pre>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={copyToClipboard}
                        className="py-1 px-3 bg-green-600 hover:bg-blue-700 text-white text-sm rounded flex items-center gap-1 transition-colors"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>
                      <button
                        onClick={startEditingPython}
                        className="py-1 px-3 bg-blue-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Edit Python Code
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <textarea
                      value={editingPythonString}
                      onChange={(e) => setEditingPythonString(e.target.value)}
                      className="w-full h-32 bg-gray-800 text-green-400 p-3 rounded font-mono text-sm resize-none"
                      placeholder="Enter Python format (polygon_1 = [(x, y), (x, y), ...])..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={applyPythonStringEdit}
                        className="py-1 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Apply Changes
                      </button>
                      <button
                        onClick={cancelEditingPython}
                        className="py-1 px-3 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Format: [(x, y), (x, y), ...] - Each line represents one polygon as a list of tuples.
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">SVG String Format</h3>
                {!isEditingSVG ? (
                  <>
                    <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                      <pre>{generateSVGString()}</pre>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={copySVGToClipboard}
                        className="py-1 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-1 transition-colors"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </button>
                      <button
                        onClick={startEditingSVG}
                        className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        Edit SVG String
                      </button>
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
                      <button
                        onClick={applySVGStringEdit}
                        className="py-1 px-3 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                      >
                        Apply Changes
                      </button>
                      <button
                        onClick={cancelEditingSVG}
                        className="py-1 px-3 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Format: Each line represents one polygon. Use space-separated x y coordinates.
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Edit Coordinates</h3>
                <div className="coordinates-panel bg-gray-50 rounded p-3 max-h-60 overflow-y-auto">
                  {polygons.length === 0 ? (
                    <p className="text-gray-500 text-sm">No polygons created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {polygons.map((polygon) => (
                        <div key={polygon.id} className="border-b border-gray-200 pb-3 mb-3 last:border-b-0">
                          <div className="font-medium text-gray-700 mb-2 flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={polygon.name}
                              onChange={(e) => {
                                const updatedPolygon = { ...polygon, name: e.target.value };
                                setPolygons(prev => prev.map(p => p.id === polygon.id ? updatedPolygon : p));
                                if (updatedPolygon.nameElement) {
                                  updatedPolygon.nameElement.textContent = e.target.value;
                                }
                              }}
                              className="text-sm border rounded px-2 py-1 flex-1"
                            />
                            <button
                              onClick={() => removePolygon(polygon)}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-all duration-200 hover:scale-110"
                              title="Delete polygon"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {polygon.points.map((point, pointIndex) => (
                              <div key={pointIndex} className="bg-gray-100 px-2 py-2 rounded flex items-center gap-2">
                                <span className="font-mono text-xs min-w-[50px]">P{pointIndex + 1}:</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">X:</span>
                                  <input
                                    type="number"
                                    value={Math.round(point.x)}
                                    onChange={(e) => {
                                      const newValue = parseFloat(e.target.value) || 0;
                                      const updatedPolygon = {
                                        ...polygon,
                                        points: polygon.points.map((p, i) =>
                                          i === pointIndex ? { ...p, x: newValue } : p
                                        )
                                      };
                                      setPolygons(prev => prev.map(p => p.id === polygon.id ? updatedPolygon : p));
                                      updatePolygonPoints(updatedPolygon);
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
                                      const updatedPolygon = {
                                        ...polygon,
                                        points: polygon.points.map((p, i) =>
                                          i === pointIndex ? { ...p, y: newValue } : p
                                        )
                                      };
                                      setPolygons(prev => prev.map(p => p.id === polygon.id ? updatedPolygon : p));
                                      updatePolygonPoints(updatedPolygon);
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