import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Shape, Point } from '../../types';
import { simplifyPolygon, previewSimplification } from '../../utils/geometryUtils';

export interface SimplificationPreview {
  shapeId: string;
  tolerance: number;
  originalPoints: Point[];
  simplifiedPoints: Point[];
  keptIndices: number[];
  removedIndices: number[];
}

export interface SimplificationPanelProps {
  shape: Shape;
  onApplySimplification: (shapeId: string, newPoints: Point[]) => void;
  onPreviewChange: (preview: SimplificationPreview | null) => void;
}

export const SimplificationPanel: React.FC<SimplificationPanelProps> = ({
  shape,
  onApplySimplification,
  onPreviewChange,
}) => {
  const [tolerance, setTolerance] = useState(5);
  const [showPreview, setShowPreview] = useState(false);
  const [originalPointsBackup, setOriginalPointsBackup] = useState<Point[] | null>(null);
  const debounceRef = useRef<number | null>(null);

  const previewResult = useMemo(() => {
    if (shape.points.length <= 3) return null;
    return previewSimplification(shape.points, tolerance);
  }, [shape.points, tolerance]);

  const simplificationResult = useMemo(() => {
    if (shape.points.length <= 3) return null;
    return simplifyPolygon(shape.points, tolerance);
  }, [shape.points, tolerance]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (showPreview && previewResult && simplificationResult) {
      debounceRef.current = window.setTimeout(() => {
        onPreviewChange({
          shapeId: shape.id,
          tolerance,
          originalPoints: shape.points,
          simplifiedPoints: simplificationResult.points,
          keptIndices: previewResult.keptIndices,
          removedIndices: previewResult.removedIndices,
        });
      }, 50);
    } else {
      onPreviewChange(null);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [showPreview, previewResult, simplificationResult, shape.id, shape.points, tolerance, onPreviewChange]);

  const handleToleranceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTolerance(Number(e.target.value));
  }, []);

  const handleApply = useCallback(() => {
    if (!simplificationResult) return;

    if (!originalPointsBackup) {
      setOriginalPointsBackup([...shape.points]);
    }

    onApplySimplification(shape.id, simplificationResult.points);
    setShowPreview(false);
    onPreviewChange(null);
  }, [simplificationResult, shape.id, shape.points, originalPointsBackup, onApplySimplification, onPreviewChange]);

  const handleReset = useCallback(() => {
    if (originalPointsBackup) {
      onApplySimplification(shape.id, originalPointsBackup);
      setOriginalPointsBackup(null);
    }
    setShowPreview(false);
    onPreviewChange(null);
  }, [originalPointsBackup, shape.id, onApplySimplification, onPreviewChange]);

  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  if (shape.points.length <= 3) {
    return (
      <div className="polydraw-simplify-section mt-3 pt-3 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Simplify Polygon</label>
        <p className="text-xs text-gray-500">Polygon has only {shape.points.length} points (minimum). Cannot simplify further.</p>
      </div>
    );
  }

  const currentCount = shape.points.length;
  const previewCount = simplificationResult?.simplifiedCount ?? currentCount;
  const reduction = currentCount - previewCount;

  return (
    <div className="polydraw-simplify-section mt-3 pt-3 border-t border-gray-200">
      <label className="block text-sm font-medium text-gray-700 mb-2">Simplify Polygon</label>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Tolerance: {tolerance}px</span>
            <span className={reduction > 0 ? 'text-blue-600 font-medium' : ''}>
              {currentCount} pts {reduction > 0 && `→ ${previewCount} pts`}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={tolerance}
            onChange={handleToleranceChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            data-testid={`simplify-tolerance-${shape.id}`}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Fine</span>
            <span>Coarse</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={togglePreview}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              data-testid={`simplify-preview-toggle-${shape.id}`}
            />
            <span className="text-gray-700">Show preview</span>
          </label>
        </div>

        {showPreview && previewResult && (
          <div className="text-xs bg-blue-50 rounded p-2">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Kept: {previewResult.kept.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 opacity-50"></span>
                <span>Removed: {previewResult.removed.length}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleApply}
            disabled={reduction === 0}
            className={`flex-1 px-3 py-1.5 text-sm rounded transition-colors ${
              reduction > 0
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            data-testid={`simplify-apply-${shape.id}`}
          >
            Apply Simplification
          </button>

          {originalPointsBackup && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
              data-testid={`simplify-reset-${shape.id}`}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
