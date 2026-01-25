import { useState, useCallback } from 'react';
import { ZoneType, DEFAULT_ZONE_TYPES } from '../types';
import { generateUniqueId } from '../utils/nameGenerator';

export interface UseZoneTypesReturn {
  zoneTypes: ZoneType[];
  addZoneType: (name: string, color: string) => ZoneType;
  updateZoneType: (id: string, updates: Partial<Omit<ZoneType, 'id'>>) => void;
  deleteZoneType: (id: string) => void;
  toggleVisibility: (id: string) => void;
  setZoneTypes: (types: ZoneType[]) => void;
  getVisibleZoneTypeIds: () => string[];
}

export const useZoneTypes = (): UseZoneTypesReturn => {
  const [zoneTypes, setZoneTypes] = useState<ZoneType[]>([...DEFAULT_ZONE_TYPES]);

  const addZoneType = useCallback((name: string, color: string): ZoneType => {
    const newType: ZoneType = {
      id: generateUniqueId(),
      name,
      color,
      isVisible: true,
    };
    setZoneTypes(prev => [...prev, newType]);
    return newType;
  }, []);

  const updateZoneType = useCallback((id: string, updates: Partial<Omit<ZoneType, 'id'>>) => {
    setZoneTypes(prev =>
      prev.map(type => (type.id === id ? { ...type, ...updates } : type))
    );
  }, []);

  const deleteZoneType = useCallback((id: string) => {
    setZoneTypes(prev => prev.filter(type => type.id !== id));
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setZoneTypes(prev =>
      prev.map(type =>
        type.id === id ? { ...type, isVisible: !type.isVisible } : type
      )
    );
  }, []);

  const getVisibleZoneTypeIds = useCallback((): string[] => {
    return zoneTypes.filter(type => type.isVisible).map(type => type.id);
  }, [zoneTypes]);

  return {
    zoneTypes,
    addZoneType,
    updateZoneType,
    deleteZoneType,
    toggleVisibility,
    setZoneTypes,
    getVisibleZoneTypeIds,
  };
};
