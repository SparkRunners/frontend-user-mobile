export type ZoneType = 'parking' | 'charging' | 'slow-speed' | 'no-go';

export type ZoneCity = 'Stockholm' | 'Göteborg' | 'Malmö';

export interface ZoneCoordinate {
  latitude: number;
  longitude: number;
}

export interface ZoneMetadata {
  description?: string;
  speedLimitKmh?: number;
}

interface BaseZone {
  id: string;
  name?: string;
  priority: number;
  metadata?: ZoneMetadata;
}

export interface PolygonZone extends BaseZone {
  type: Exclude<ZoneType, 'charging'>;
  coordinatesSets: ZoneCoordinate[][];
}

export interface ChargingZone extends BaseZone {
  type: 'charging';
  coordinate: ZoneCoordinate;
}

export interface ZonesCollection {
  parkingZones: PolygonZone[];
  slowSpeedZones: PolygonZone[];
  noGoZones: PolygonZone[];
  chargingStations: ChargingZone[];
}
