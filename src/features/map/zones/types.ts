export type ZoneType = 'parking' | 'charging' | 'slow-speed' | 'no-go';

export type ZoneCity = 'Stockholm' | 'Göteborg' | 'Malmö';

export interface ZoneCoordinate {
  latitude: number;
  longitude: number;
}

export interface ZoneRulesInfo {
  parkingAllowed?: boolean;
  ridingAllowed?: boolean;
  maxSpeed?: number;
}

export interface PolygonZone {
  id: string;
  type: ZoneType;
  name?: string;
  priority: number;
  coordinatesSets: ZoneCoordinate[][];
  rules?: ZoneRulesInfo;
}

export interface ZonesCollection {
  parkingZones: PolygonZone[];
  slowSpeedZones: PolygonZone[];
  noGoZones: PolygonZone[];
  chargingZones: PolygonZone[];
}
