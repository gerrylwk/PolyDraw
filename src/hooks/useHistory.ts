import { useCallback, useRef, useState } from 'react';
import { Point, ShapeStyle, ShapeType } from '../types';

export interface ShapeSnapshot {
  id: string;
  type: ShapeType;
  name: string;
  style: ShapeStyle;
  points: Point[];
  zoneType?: string;
}

const MAX_HISTORY_SIZE = 50;

export interface UseHistoryReturn {
  pushState: (snapshots: ShapeSnapshot[]) => void;
  undo: (current: ShapeSnapshot[]) => ShapeSnapshot[] | null;
  redo: (current: ShapeSnapshot[]) => ShapeSnapshot[] | null;
  discardLast: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

export const useHistory = (): UseHistoryReturn => {
  const pastRef = useRef<ShapeSnapshot[][]>([]);
  const futureRef = useRef<ShapeSnapshot[][]>([]);
  const [, setRevision] = useState(0);

  const bump = useCallback(() => setRevision(n => n + 1), []);

  const pushState = useCallback((snapshots: ShapeSnapshot[]) => {
    pastRef.current.push(snapshots);
    if (pastRef.current.length > MAX_HISTORY_SIZE) {
      pastRef.current = pastRef.current.slice(-MAX_HISTORY_SIZE);
    }
    futureRef.current = [];
    bump();
  }, [bump]);

  const undo = useCallback((current: ShapeSnapshot[]): ShapeSnapshot[] | null => {
    if (pastRef.current.length === 0) return null;
    const previous = pastRef.current.pop()!;
    futureRef.current.push(current);
    bump();
    return previous;
  }, [bump]);

  const redo = useCallback((current: ShapeSnapshot[]): ShapeSnapshot[] | null => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current.pop()!;
    pastRef.current.push(current);
    bump();
    return next;
  }, [bump]);

  const discardLast = useCallback(() => {
    if (pastRef.current.length > 0) {
      pastRef.current.pop();
      bump();
    }
  }, [bump]);

  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    bump();
  }, [bump]);

  return {
    pushState,
    undo,
    redo,
    discardLast,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    clear,
  };
};
