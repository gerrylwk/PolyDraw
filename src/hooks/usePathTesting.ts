import { useState, useCallback, useRef } from 'react';
import { Point, Shape, PathTestPoint, PathTestingState } from '../types';
import { runContainmentChecks } from '../utils/geometryUtils';
import { parsePathFromText, formatPathToText } from '../utils/pathParsingUtils';

const MAX_POINTS = 1000;
const MIN_DISTANCE = 8;

export interface UsePathTestingReturn {
  state: PathTestingState;
  startDrawing: (point: Point, shapes: Shape[]) => void;
  addPathPoint: (point: Point, shapes: Shape[]) => void;
  completeDrawing: (shapes: Shape[]) => void;
  clearPath: () => void;
  updateFromText: (text: string, shapes: Shape[]) => void;
  togglePanelCollapse: () => void;
  setHoveredPointIndex: (index: number | null) => void;
  hoveredPointIndex: number | null;
}

export const usePathTesting = (): UsePathTestingReturn => {
  const [state, setState] = useState<PathTestingState>({
    testPath: [],
    isDrawing: false,
    isPanelCollapsed: false,
    textContent: '',
  });

  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const buildTestPoints = useCallback(
    (rawPoints: Point[], shapes: Shape[]): PathTestPoint[] => {
      const results = runContainmentChecks(rawPoints, shapes);
      return rawPoints.map((p, i) => ({
        x: p.x,
        y: p.y,
        index: i,
        status: results[i].status,
        containingPolygons: results[i].containingPolygons,
        validFormat: true,
      }));
    },
    []
  );

  const startDrawing = useCallback(
    (point: Point, shapes: Shape[]) => {
      lastPointRef.current = point;
      const testPath = buildTestPoints([point], shapes);
      setState({
        testPath,
        isDrawing: true,
        isPanelCollapsed: false,
        textContent: formatPathToText(testPath),
      });
    },
    [buildTestPoints]
  );

  const addPathPoint = useCallback(
    (point: Point, shapes: Shape[]) => {
      setState(prev => {
        if (!prev.isDrawing || prev.testPath.length >= MAX_POINTS) return prev;

        const last = lastPointRef.current;
        if (last) {
          const dx = point.x - last.x;
          const dy = point.y - last.y;
          if (Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE) return prev;
        }

        lastPointRef.current = point;
        const rawPoints = [...prev.testPath.map(p => ({ x: p.x, y: p.y })), point];
        const testPath = buildTestPoints(rawPoints, shapes);
        return {
          ...prev,
          testPath,
          textContent: formatPathToText(testPath),
        };
      });
    },
    [buildTestPoints]
  );

  const completeDrawing = useCallback(
    (shapes: Shape[]) => {
      setState(prev => {
        const rawPoints = prev.testPath.map(p => ({ x: p.x, y: p.y }));
        const testPath = buildTestPoints(rawPoints, shapes);
        return {
          ...prev,
          isDrawing: false,
          testPath,
          textContent: formatPathToText(testPath),
        };
      });
      lastPointRef.current = null;
    },
    [buildTestPoints]
  );

  const clearPath = useCallback(() => {
    lastPointRef.current = null;
    setState({
      testPath: [],
      isDrawing: false,
      isPanelCollapsed: false,
      textContent: '',
    });
  }, []);

  const updateFromText = useCallback(
    (text: string, shapes: Shape[]) => {
      const parsed = parsePathFromText(text);
      const validPoints = parsed.filter(p => p.validFormat).slice(0, MAX_POINTS);
      const rawPoints = validPoints.map(p => ({ x: p.x, y: p.y }));
      const testPath = buildTestPoints(rawPoints, shapes);

      let finalPath = testPath;
      let invalidIdx = 0;
      const fullPath: PathTestPoint[] = [];
      for (let i = 0; i < parsed.length; i++) {
        if (parsed[i].validFormat && invalidIdx < testPath.length) {
          fullPath.push(testPath[invalidIdx]);
          invalidIdx++;
        } else if (!parsed[i].validFormat) {
          fullPath.push({ ...parsed[i], index: fullPath.length });
        }
      }

      if (fullPath.length > 0 && fullPath.some(p => !p.validFormat)) {
        finalPath = fullPath;
      }

      setState(prev => ({
        ...prev,
        testPath: finalPath,
        textContent: text,
      }));
    },
    [buildTestPoints]
  );

  const togglePanelCollapse = useCallback(() => {
    setState(prev => ({ ...prev, isPanelCollapsed: !prev.isPanelCollapsed }));
  }, []);

  return {
    state,
    startDrawing,
    addPathPoint,
    completeDrawing,
    clearPath,
    updateFromText,
    togglePanelCollapse,
    setHoveredPointIndex,
    hoveredPointIndex,
  };
};
