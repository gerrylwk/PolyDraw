import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, Check, Pencil } from 'lucide-react';
import { Button } from '../UI';
import { Shape, ZoneType } from '../../types';
import { generateZoneJSON, parseZoneJSON, createDebouncedSerializer } from '../../utils';

export interface JsonSchemaWidgetProps {
  shapes: Shape[];
  zoneTypes: ZoneType[];
  currentOpacity: number;
  onShapesReplace: (shapes: Shape[]) => void;
  onZoneTypesReplace: (types: ZoneType[]) => void;
  onClearShapes: () => void;
}

export const JsonSchemaWidget: React.FC<JsonSchemaWidgetProps> = ({
  shapes,
  zoneTypes,
  currentOpacity,
  onShapesReplace,
  onZoneTypesReplace,
  onClearShapes,
}) => {
  const [jsonString, setJsonString] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const serializerRef = useRef(createDebouncedSerializer(250));

  useEffect(() => {
    if (!isEditing) {
      serializerRef.current.schedule(shapes, zoneTypes, (json) => {
        setJsonString(json);
      });
    }

    return () => {
      serializerRef.current.cancel();
    };
  }, [shapes, zoneTypes, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      const json = generateZoneJSON(shapes, zoneTypes);
      setJsonString(json);
    }
  }, []);

  const handleStartEdit = () => {
    setEditValue(jsonString);
    setIsEditing(true);
    setParseError(null);
    setHasUnsavedChanges(false);
  };

  const handleEditChange = (value: string) => {
    setEditValue(value);
    setHasUnsavedChanges(true);
    setParseError(null);
  };

  const handleApplyChanges = useCallback(() => {
    try {
      const { shapes: parsedShapes, zoneTypes: parsedTypes } = parseZoneJSON(
        editValue,
        currentOpacity
      );

      onClearShapes();

      if (parsedTypes.length > 0) {
        onZoneTypesReplace(parsedTypes);
      }

      onShapesReplace(parsedShapes);

      setIsEditing(false);
      setEditValue('');
      setParseError(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  }, [editValue, currentOpacity, onClearShapes, onShapesReplace, onZoneTypesReplace]);

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
    setParseError(null);
    setHasUnsavedChanges(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <section className="polydraw-json-schema-widget">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">Zone Schema (JSON)</h3>

      {!isEditing ? (
        <div className="polydraw-json-display-mode">
          <div
            className="bg-gray-800 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto"
            data-testid="json-code-display"
          >
            <pre>{jsonString || '{\n  "zones": [],\n  "zone_types": []\n}'}</pre>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              onClick={copyToClipboard}
              variant="primary"
              size="sm"
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              onClick={handleStartEdit}
              variant="secondary"
              size="sm"
              icon={<Pencil size={14} />}
            >
              Edit
            </Button>
          </div>
        </div>
      ) : (
        <div className="polydraw-json-edit-mode">
          <textarea
            value={editValue}
            onChange={e => handleEditChange(e.target.value)}
            className={`w-full h-64 bg-gray-800 text-green-400 p-3 rounded font-mono text-xs resize-none border-2 ${
              hasUnsavedChanges ? 'border-yellow-500' : 'border-transparent'
            } ${parseError ? 'border-red-500' : ''}`}
            spellCheck={false}
            data-testid="json-editor"
          />
          {parseError && (
            <div className="text-red-500 text-xs mt-1">{parseError}</div>
          )}
          <div className="flex gap-2 mt-2">
            <Button
              onClick={handleApplyChanges}
              variant="primary"
              size="sm"
            >
              Apply Changes
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Paste or edit JSON. Changes replace all existing zones.
          </div>
        </div>
      )}
    </section>
  );
};
