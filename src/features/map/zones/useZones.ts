import { useCallback, useEffect, useState } from 'react';
import { scooterApiClient } from '../../../api/httpClient';
import type {
  ChargingZone,
  PolygonZone,
  ZoneCity,
  ZoneCoordinate,
  ZoneMetadata,
  ZoneType,
} from './types';

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
  id: string;
  type: string;
  city?: string;
  name?: string;
  priority?: number;
  properties?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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

const getString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const getNumber = (value: unknown): number | undefined =>
  typeof value === 'number' ? value : undefined;

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

const toLatLng = (coordinate: [number, number]): ZoneCoordinate => ({
  longitude: coordinate[0],
  latitude: coordinate[1],
});

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

const resolvePriority = (dto: ZoneDto): number => {
  const fromProps = getNumber(dto.properties?.priority);
  const fromMetadata = getNumber((dto.metadata as Record<string, unknown> | undefined)?.priority);
  const value =
    getNumber(dto.priority) ?? fromProps ?? fromMetadata;
  return typeof value === 'number' ? value : DEFAULT_PRIORITY;
};

const resolveSpeedLimit = (dto: ZoneDto): number | undefined => {
  const raw =
    getNumber(dto.properties?.speedLimitKmh) ??
    getNumber((dto.properties as Record<string, unknown> | undefined)?.speed_limit) ??
    getNumber((dto.metadata as Record<string, unknown> | undefined)?.speedLimitKmh) ??
    getNumber((dto.metadata as Record<string, unknown> | undefined)?.speed_limit);
  return raw;
};

const buildMetadata = (dto: ZoneDto): ZoneMetadata | undefined => {
  const description =
    getString(dto.properties?.description) ??
    getString((dto.metadata as Record<string, unknown> | undefined)?.description);
  const speedLimitKmh = resolveSpeedLimit(dto);
  if (!description && typeof speedLimitKmh !== 'number') {
    return undefined;
  }
  return {
    description,
    speedLimitKmh,
  };
};

const mapDtoToZone = (dto: ZoneDto): PolygonZone | ChargingZone | null => {
  const type = normalizeZoneType(dto.type ?? getString(dto.properties?.type));
  if (!type) {
    return null;
  }

  const priority = resolvePriority(dto);
  const metadata = buildMetadata(dto);

  if (type === 'charging') {
    if (dto.geometry.type !== 'Point') {
      return null;
    }
    return {
      id: dto.id,
      type: 'charging',
      name: dto.name,
      priority,
      coordinate: toLatLng(dto.geometry.coordinates),
      metadata,
    };
  }

  if (dto.geometry.type === 'Point') {
    return null;
  }

  const coordinatesSets = extractPolygonSets(dto.geometry);
  if (!coordinatesSets.length) {
    return null;
  }

  return {
    id: dto.id,
    type,
    name: dto.name,
    priority,
    coordinatesSets,
    metadata,
  } as PolygonZone;
};

const sortByPriority = <T extends { priority: number }>(zones: T[]) =>
  zones.sort((a, b) => a.priority - b.priority);

export interface UseZonesResult {
  parkingZones: PolygonZone[];
  slowSpeedZones: PolygonZone[];
  noGoZones: PolygonZone[];
  chargingStations: ChargingZone[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  city: ZoneCity;
}

export const useZones = (city: ZoneCity = 'Stockholm'): UseZonesResult => {
  const [parkingZones, setParkingZones] = useState<PolygonZone[]>([]);
  const [slowSpeedZones, setSlowSpeedZones] = useState<PolygonZone[]>([]);
  const [noGoZones, setNoGoZones] = useState<PolygonZone[]>([]);
  const [chargingStations, setChargingStations] = useState<ChargingZone[]>([]);
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
      const nextCharging: ChargingZone[] = [];

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
      setChargingStations(sortByPriority(nextCharging));
    } catch (err) {
      console.error('Failed to load zones', err);
      setError('Kunde inte hämta zoner. Försök igen.');
      setParkingZones([]);
      setSlowSpeedZones([]);
      setNoGoZones([]);
      setChargingStations([]);
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
    chargingStations,
    isLoading,
    error,
    refetch,
    city,
  };
};
