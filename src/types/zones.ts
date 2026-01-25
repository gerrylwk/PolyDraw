export interface ZoneType {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
}

export interface ZoneAnnotation {
  name: string;
  zone_type: string;
  points: string;
}

export interface ZoneSchema {
  zones: ZoneAnnotation[];
  zone_types: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export const DEFAULT_ZONE_TYPES: ZoneType[] = [
  { id: 'region', name: 'region', color: '#3b82f6', isVisible: true },
  { id: 'exclusion', name: 'exclusion', color: '#ef4444', isVisible: true },
  { id: 'highlight', name: 'highlight', color: '#eab308', isVisible: true },
];
