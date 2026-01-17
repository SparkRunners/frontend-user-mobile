import { useCallback, useEffect, useState } from 'react';
import { scooterApiClient } from '../../../api/httpClient';
import type { PolygonZone, ZoneCity, ZoneCoordinate, ZoneRulesInfo, ZoneType } from './types';

// Base URL (SCOOTER_API_BASE_URL) already ends with /api/v1, so we only append the resource path here.
const ZONES_ENDPOINT = '/zones';
const DEFAULT_PRIORITY = 0;

type GeoJsonPoint = {
  type: 'Point';
  coordinates: [number, number];
};

type GeoJsonPolygon = {
  type: 'Polygon';
  coordinates: number[][][];
};

type GeoJsonMultiPolygon = {
  type: 'MultiPolygon';
  coordinates: number[][][][];
};

type GeoJsonGeometry = GeoJsonPoint | GeoJsonPolygon | GeoJsonMultiPolygon;

type ZoneDto = {
  _id?: string;
  id?: string;
  type?: string;
  city?: string;
  name?: string;
  priority?: number;
  rules?: {
    parkingAllowed?: boolean;
    ridingAllowed?: boolean;
    maxSpeed?: number;
  };
  geometry: GeoJsonGeometry;
};

const extractZoneList = (payload: unknown): ZoneDto[] => {
  if (Array.isArray(payload)) {
    return payload as ZoneDto[];
  }

  if (payload && typeof payload === 'object') {
    const objPayload = payload as Record<string, unknown>;
    const zonesMaybe = objPayload.zones;
    if (Array.isArray(zonesMaybe)) {
      return zonesMaybe as ZoneDto[];
    }

    const dataMaybe = objPayload.data;
    if (Array.isArray(dataMaybe)) {
      return dataMaybe as ZoneDto[];
    }
  }

  return [];
};

const cityLabelToValue = (city?: string): ZoneCity => {
  if (city === 'Göteborg' || city === 'Malmö') {
    return city;
  }
  return 'Stockholm';
};

const normalizeZoneType = (value: string | undefined): ZoneType | null => {
  if (!value) {
    return null;
  }
  const normalized = value.toLowerCase();
  switch (normalized) {
    case 'parking':
      return 'parking';
    case 'charging':
      return 'charging';
    case 'slow-speed':
    case 'slow_speed':
    case 'slow':
      return 'slow-speed';
    case 'no-go':
    case 'no_go':
    case 'nogo':
      return 'no-go';
    default:
      return null;
  }
};

const toLatLng = (coordinate: number[]): ZoneCoordinate => {
  const [longitude = 0, latitude = 0] = coordinate;
  return { longitude, latitude };
};

const extractPolygonSets = (
  geometry: GeoJsonPolygon | GeoJsonMultiPolygon,
): ZoneCoordinate[][] => {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => ring.map(toLatLng));
  }
  return geometry.coordinates.flatMap(polygon =>
    polygon.map(ring => ring.map(toLatLng)),
  );
};

const resolvePriority = (dto: ZoneDto): number =>
  typeof dto.priority === 'number' ? dto.priority : DEFAULT_PRIORITY;

const mapRules = (dto: ZoneDto): ZoneRulesInfo | undefined => {
  if (!dto.rules) {
    return undefined;
  }
  const { parkingAllowed, ridingAllowed, maxSpeed } = dto.rules;
  if (
    typeof parkingAllowed === 'undefined' &&
    typeof ridingAllowed === 'undefined' &&
    typeof maxSpeed === 'undefined'
  ) {
    return undefined;
  }
  return { parkingAllowed, ridingAllowed, maxSpeed };
};

const mapDtoToZone = (dto: ZoneDto): PolygonZone | null => {
  const type = normalizeZoneType(dto.type);
  if (!type) {
    return null;
  }

  const priority = resolvePriority(dto);
  const rules = mapRules(dto);

  if (dto.geometry.type === 'Point') {
    return null;
  }

  const coordinatesSets = extractPolygonSets(dto.geometry);
  if (!coordinatesSets.length) {
    return null;
  }

  return {
    id: dto.id ?? dto._id ?? `${type}-${Math.random()}`,
    type,
    name: dto.name,
    priority,
    coordinatesSets,
    rules,
  };
};

const sortByPriority = <T extends { priority: number }>(zones: T[]) =>
  zones.sort((a, b) => a.priority - b.priority);

export interface UseZonesResult {
  parkingZones: PolygonZone[];
  slowSpeedZones: PolygonZone[];
  noGoZones: PolygonZone[];
  chargingZones: PolygonZone[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  city: ZoneCity;
}

export const useZones = (city: ZoneCity = 'Stockholm'): UseZonesResult => {
  const [parkingZones, setParkingZones] = useState<PolygonZone[]>([]);
  const [slowSpeedZones, setSlowSpeedZones] = useState<PolygonZone[]>([]);
  const [noGoZones, setNoGoZones] = useState<PolygonZone[]>([]);
  const [chargingZones, setChargingZones] = useState<PolygonZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await scooterApiClient.get<ZoneDto[]>(ZONES_ENDPOINT, {
        params: { city: cityLabelToValue(city) },
      });

      const zoneDtos = extractZoneList(response.data);
      if (!zoneDtos.length) {
        throw new Error('Zones payload saknas eller har fel format');
      }

      const nextParking: PolygonZone[] = [];
      const nextSlow: PolygonZone[] = [];
      const nextNoGo: PolygonZone[] = [];
      const nextCharging: PolygonZone[] = [];

      zoneDtos.forEach(dto => {
        const zone = mapDtoToZone(dto);
        if (!zone) {
          return;
        }
            if (zone.type === 'parking') {
              nextParking.push(zone);
            } else if (zone.type === 'slow-speed') {
              nextSlow.push(zone);
            } else if (zone.type === 'no-go') {
              nextNoGo.push(zone);
            } else if (zone.type === 'charging') {
              nextCharging.push(zone);
            }
      });

      setParkingZones(sortByPriority(nextParking));
      setSlowSpeedZones(sortByPriority(nextSlow));
      setNoGoZones(sortByPriority(nextNoGo));
      setChargingZones(sortByPriority(nextCharging));
    } catch (err) {
      console.error('Failed to load zones', err);
      setError('Kunde inte hämta zoner. Försök igen.');
      setParkingZones([]);
      setSlowSpeedZones([]);
      setNoGoZones([]);
      setChargingZones([]);
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => load(), [load]);

  return {
    parkingZones,
    slowSpeedZones,
    noGoZones,
    chargingZones,
    isLoading,
    error,
    refetch,
    city,
  };
};
