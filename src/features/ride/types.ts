export interface Ride {
  id: string;
  scooterId: string;
  userId: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  status: 'active' | 'completed' | 'cancelled';
  cost: number;
  durationSeconds: number;
}

export interface RideStatus {
  isRiding: boolean;
  currentRide: Ride | null;
}

export type ZoneRuleType = 'no-go' | 'slow-speed' | 'parking' | 'charging' | 'normal' | string;

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface ZoneRuleMatch {
  type: ZoneRuleType;
  priority: number;
  message?: string;
  speedLimitKmh?: number;
}

export interface ParkingHint {
  id: string;
  name?: string;
  priority?: number;
  distanceMeters?: number;
  coordinate: GeoCoordinate;
}

export interface ZoneCheckResult {
  rule: ZoneRuleMatch | null;
  nearestParking: ParkingHint | null;
}

export interface ZoneCheckRequest {
  latitude: number;
  longitude: number;
  city?: string;
}
