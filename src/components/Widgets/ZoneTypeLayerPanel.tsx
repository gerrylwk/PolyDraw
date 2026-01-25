import React, { useState } from 'react';
import { Eye, EyeOff, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { ZoneType, Shape } from '../../types';

export interface ZoneTypeLayerPanelProps {
  zoneTypes: ZoneType[];
  shapes: Shape[];
  onAddType: (name: string, color: string) => void;
  onUpdateType: (id: string, updates: Partial<Omit<ZoneType, 'id'>>) => void;
  onDeleteType: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export const ZoneTypeLayerPanel: React.FC<ZoneTypeLayerPanelProps> = ({
  zoneTypes,
  shapes,
  onAddType,
  onUpdateType,
  onDeleteType,
  onToggleVisibility,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const getZoneCount = (typeId: string): number => {
    return shapes.filter(s => s.zoneType === typeId).length;
  };

  const handleAddNew = () => {
    if (newName.trim()) {
      onAddType(newName.trim(), newColor);
      setNewName('');
      setNewColor('#3b82f6');
      setIsAddingNew(false);
    }
  };

  const handleStartEdit = (type: ZoneType) => {
    setEditingId(type.id);
    setEditName(type.name);
    setEditColor(type.color);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdateType(editingId, { name: editName.trim(), color: editColor });
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const count = getZoneCount(id);
    if (count > 0) {
      if (!confirm(`This zone type is used by ${count} zone(s). Delete anyway?`)) {
        return;
      }
    }
    onDeleteType(id);
  };

  return (
    <section className="polydraw-zone-layer-panel border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Zone Types</h3>
        <button
          onClick={() => setIsAddingNew(true)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Add zone type"
        >
          <Plus size={16} className="text-gray-600" />
        </button>
      </div>

      <div className="space-y-2">
        {zoneTypes.map(type => (
          <div
            key={type.id}
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
          >
            {editingId === type.id ? (
              <>
                <input
                  type="color"
                  value={editColor}
                  onChange={e => setEditColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border rounded"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                  <Check size={14} className="text-green-600" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <X size={14} className="text-red-600" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onToggleVisibility(type.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title={type.isVisible ? 'Hide' : 'Show'}
                >
                  {type.isVisible ? (
                    <Eye size={14} className="text-gray-600" />
                  ) : (
                    <EyeOff size={14} className="text-gray-400" />
                  )}
                </button>
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: type.color }}
                />
                <span
                  className={`flex-1 text-sm ${
                    type.isVisible ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {type.name}
                </span>
                <span className="text-xs text-gray-400 mr-2">
                  {getZoneCount(type.id)}
                </span>
                <button
                  onClick={() => handleStartEdit(type)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Edit"
                >
                  <Pencil size={12} className="text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} className="text-gray-500" />
                </button>
              </>
            )}
          </div>
        ))}

        {isAddingNew && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Type name..."
              className="flex-1 px-2 py-1 text-sm border rounded"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddNew();
                if (e.key === 'Escape') {
                  setIsAddingNew(false);
                  setNewName('');
                }
              }}
            />
            <button
              onClick={handleAddNew}
              disabled={!newName.trim()}
              className="p-1 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
            >
              <Check size={14} className="text-green-600" />
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false);
                setNewName('');
              }}
              className="p-1 hover:bg-red-100 rounded transition-colors"
            >
              <X size={14} className="text-red-600" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
