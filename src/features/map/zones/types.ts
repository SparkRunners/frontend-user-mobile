export type ZoneKind = 'parking' | 'allowed';

export interface ZoneCoordinate {
  latitude: number;
  longitude: number;
}

export interface Zone {
  id: string;
  kind: ZoneKind;
  name: string;
  description?: string;
  coordinates: ZoneCoordinate[];
}
