import { scooterApiClient } from '../../api/httpClient';
import {
  Ride,
  ZoneCheckRequest,
  ZoneCheckResult,
  ZoneRuleMatch,
  ParkingHint,
  GeoCoordinate,
} from './types';

// Base URL (SCOOTER_API_BASE_URL) already ends with /api/v1 so we only append resource segments here.
const RENT_BASE_PATH = '/rent';
const ZONE_RULES_PATH = '/zones/check';

type RentTripDto = {
  id?: string;
  _id?: string;
  tripId?: string;
  scooterId?: string;
  scooter_id?: string;
  scooterID?: string;
  vehicleId?: string;
  userId?: string;
  riderId?: string;
  ownerId?: string;
  startTime?: string;
  startedAt?: string;
  endTime?: string | null;
  completedAt?: string | null;
  status?: string;
  cost?: number | string;
  totalCost?: number | string;
  duration?: number | string;
  durationSeconds?: number | string;
};

const ensureValue = (value: string | undefined, fallback: string | undefined, label: string) => {
  const resolved = value ?? fallback;
  if (!resolved) {
    throw new Error(`Ride payload missing required field: ${label}`);
  }
  return resolved;
};

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '.');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const parseCurrencyValue = (value: unknown, fallback = 0): number => {
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9,.-]/g, '').replace(/,/g, '.');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return toFiniteNumber(value, fallback);
};

const parseDurationSeconds = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const match = value.match(/([0-9]+[.,]?[0-9]*)/);
    if (match) {
      const numeric = Number(match[1].replace(',', '.'));
      if (Number.isFinite(numeric)) {
        if (/hour/i.test(value)) {
          return Math.round(numeric * 3600);
        }
        if (/second/i.test(value)) {
          return Math.round(numeric);
        }
        return Math.round(numeric * 60);
      }
    }
  }
  return fallback;
};

const readStringField = (
  payload: RentTripDto | null | undefined,
  ...keys: Array<keyof RentTripDto | string>
): string | undefined => {
  if (!payload) {
    return undefined;
  }
  for (const key of keys) {
    const value = (payload as Record<string, unknown>)[key as string];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
};

const resolveStatus = (payload: RentTripDto): Ride['status'] => {
  const normalized = payload.status?.toLowerCase();
  if (normalized === 'active' || normalized === 'completed' || normalized === 'cancelled') {
    return normalized;
  }
  return payload.endTime ? 'completed' : 'active';
};

const mapToRide = (payload: RentTripDto | null | undefined, fallback?: Ride): Ride => {
  if (!payload && !fallback) {
    throw new Error('Ride payload is empty');
  }

  const id = ensureValue(
    readStringField(payload, 'id', '_id', 'tripId'),
    fallback?.id,
    'id',
  );
  const scooterId = ensureValue(
    readStringField(payload, 'scooterId', 'scooter_id', 'scooterID', 'vehicleId'),
    fallback?.scooterId,
    'scooterId',
  );
  const userId = ensureValue(
    readStringField(payload, 'userId', 'riderId', 'ownerId'),
    fallback?.userId ?? 'unknown-user',
    'userId',
  );

  const startTime =
    readStringField(payload, 'startTime', 'startedAt') ??
    fallback?.startTime ??
    new Date().toISOString();
  const endTime =
    readStringField(payload, 'endTime', 'completedAt') ??
    fallback?.endTime ??
    undefined;

  const shouldResolveStatus = Boolean(
    payload &&
      (payload.status || payload.endTime || payload.completedAt),
  );
  const resolvedStatus = shouldResolveStatus
    ? resolveStatus(payload as RentTripDto)
    : fallback?.status ?? 'completed';
  const cost = parseCurrencyValue(payload?.cost ?? payload?.totalCost, fallback?.cost ?? 0);
  const durationSeconds = parseDurationSeconds(
    payload?.durationSeconds ?? payload?.duration,
    fallback?.durationSeconds ?? 0,
  );

  return {
    id,
    scooterId,
    userId,
    startTime,
    endTime,
    status: resolvedStatus,
    cost,
    durationSeconds,
  };
};

const encodeId = (value: string) => encodeURIComponent(value);

const unwrapTripPayload = (payload: unknown): RentTripDto | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (record.trip && typeof record.trip === 'object') {
    return record.trip as RentTripDto;
  }

  if ('id' in record) {
    return record as RentTripDto;
  }

  return null;
};

type GenericRecord = Record<string, unknown>;

const readString = (source: GenericRecord, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
};

const readNumber = (source: GenericRecord, ...keys: Array<string>): number | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
};

const toCoordinate = (source?: GenericRecord): GeoCoordinate | null => {
  if (!source) {
    return null;
  }
  const latitude = readNumber(source, 'latitude', 'lat', 'Latitude');
  const longitude = readNumber(source, 'longitude', 'lng', 'lon', 'Longitude');
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null;
  }
  return { latitude, longitude };
};

const normalizeRuleType = (value?: string): ZoneRuleMatch['type'] => {
  if (!value) {
    return 'normal';
  }
  const normalized = value.toLowerCase();
  if (normalized === 'no-go' || normalized === 'no_go') {
    return 'no-go';
  }
  if (normalized === 'slow-speed' || normalized === 'slow_speed' || normalized === 'slow') {
    return 'slow-speed';
  }
  if (normalized === 'parking') {
    return 'parking';
  }
  if (normalized === 'charging') {
    return 'charging';
  }
  return value as ZoneRuleMatch['type'];
};

const mapToZoneRuleMatch = (source?: GenericRecord | null): ZoneRuleMatch | null => {
  if (!source) {
    return null;
  }
  const type = normalizeRuleType(readString(source, 'rule', 'type', 'name'));
  const priority = readNumber(source, 'priority', 'severity', 'weight') ?? 0;
  const message = readString(source, 'message', 'description', 'label');
  const speedLimit =
    readNumber(source, 'speedLimitKmh', 'speed_limit_kmh', 'speedLimit', 'speed_limit');

  return {
    type,
    priority,
    message,
    speedLimitKmh: speedLimit,
  };
};

const mapToParkingHint = (source?: GenericRecord | null): ParkingHint | null => {
  if (!source) {
    return null;
  }
  const coordinate = toCoordinate(
    (source.coordinate as GenericRecord | undefined) ?? source,
  );
  if (!coordinate) {
    return null;
  }

  const id = readString(source, 'id', 'zoneId', 'parkingId') ?? 'parking-hint';
  const name = readString(source, 'name', 'label');
  const priority = readNumber(source, 'priority');
  const distanceMeters = readNumber(source, 'distanceMeters', 'distance', 'distance_m');

  return {
    id,
    name,
    priority,
    distanceMeters,
    coordinate,
  };
};

const extractZoneRulePayload = (payload: unknown): GenericRecord | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const record = payload as GenericRecord;
  if (record.data && typeof record.data === 'object') {
    return extractZoneRulePayload(record.data) ?? (record.data as GenericRecord);
  }
  if (record.result && typeof record.result === 'object') {
    return extractZoneRulePayload(record.result) ?? (record.result as GenericRecord);
  }
  if (record.check && typeof record.check === 'object') {
    return extractZoneRulePayload(record.check) ?? (record.check as GenericRecord);
  }
  return record;
};

const toArray = (value: unknown): GenericRecord[] =>
  Array.isArray(value) ? (value as GenericRecord[]) : [];

const mapZoneCheckResult = (payload: unknown): ZoneCheckResult => {
  const source = extractZoneRulePayload(payload);
  if (!source) {
    return { rule: null, nearestParking: null };
  }

  const ruleCandidates: GenericRecord[] = [
    ...toArray(source.rules),
    ...toArray(source.violations),
  ];

  if (!ruleCandidates.length && (source.rule || source.type)) {
    ruleCandidates.push(source);
  }

  const orderedRules = ruleCandidates
    .map(candidate => mapToZoneRuleMatch(candidate))
    .filter((candidate): candidate is ZoneRuleMatch => Boolean(candidate))
    .sort((a, b) => b.priority - a.priority);

  const rule = orderedRules[0] ?? null;
  const nearestParking = mapToParkingHint(
    (source.nearestParking as GenericRecord | undefined) ??
      (source.nearest_parking as GenericRecord | undefined) ??
      null,
  );

  return { rule, nearestParking };
};

const getStatusCode = (error: unknown): number | null => {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const response = (error as { response?: { status?: number } }).response;
  if (!response) {
    return null;
  }
  return typeof response.status === 'number' ? response.status : null;
};

type TripListPayload = RentTripDto[] | { trips?: RentTripDto[] | undefined } | { data?: unknown };

const parseTripPayload = (payload: TripListPayload): { trips: RentTripDto[]; recognized: boolean } => {
  if (Array.isArray(payload)) {
    return { trips: payload, recognized: true };
  }

  if (payload && typeof payload === 'object') {
    const container = payload as Record<string, unknown>;

    if (Array.isArray(container.trips)) {
      return { trips: container.trips, recognized: true };
    }

    if (container.data) {
      if (Array.isArray(container.data)) {
        return { trips: container.data, recognized: true };
      }

      if (typeof container.data === 'object' && container.data !== null) {
        const nested = container.data as Record<string, unknown>;
        if (Array.isArray(nested.trips)) {
          return { trips: nested.trips, recognized: true };
        }
      }
    }
  }

  return { trips: [], recognized: false };
};

export const rideApi = {
  startRide: async (scooterId: string): Promise<Ride> => {
    try {
      const response = await scooterApiClient.post<RentTripDto>(
        `${RENT_BASE_PATH}/start/${encodeId(scooterId)}`,
      );
      return mapToRide(unwrapTripPayload(response.data));
    } catch (error) {
      if (__DEV__) {
        const response = (error as { response?: { status?: number; data?: unknown } }).response;
        console.warn('[rideApi] startRide failed', response?.status, response?.data);
      }
      throw error;
    }
  },

  endRide: async (scooterId: string, fallback?: Ride): Promise<Ride> => {
    if (!scooterId) {
      throw new Error('Scooter-id krävs för att avsluta resan');
    }
    try {
      const response = await scooterApiClient.post<RentTripDto>(
        `${RENT_BASE_PATH}/stop/${encodeId(scooterId)}`,
      );
      return mapToRide(unwrapTripPayload(response.data), fallback);
    } catch (error) {
      if (__DEV__) {
        const response = (error as { response?: { status?: number; data?: unknown } }).response;
        console.warn('[rideApi] endRide failed', response?.status, response?.data);
      }
      throw error;
    }
  },

  getCurrentRide: async (): Promise<Ride | null> => {
    try {
      const response = await scooterApiClient.get<RentTripDto[]>(`${RENT_BASE_PATH}/history`, {
        params: { status: 'active', limit: 1 },
      });
      const active = response.data.find(trip => resolveStatus(trip) === 'active');
      return active ? mapToRide(active) : null;
    } catch (error) {
      console.warn('rideApi.getCurrentRide is unavailable on this backend version', error);
      return null;
    }
  },

  getRideHistory: async (): Promise<Ride[]> => {
    try {
      const response = await scooterApiClient.get<TripListPayload>(`${RENT_BASE_PATH}/history`);
      const { trips, recognized } = parseTripPayload(response.data);

      if (!recognized && __DEV__) {
        console.warn('[rideApi] ride history payload not recognized, returning empty list');
      }

      return trips.map(trip => mapToRide(trip));
    } catch (error) {
      const status = getStatusCode(error);
      if (status === 401 || status === 403) {
        if (__DEV__) {
          console.warn('[rideApi] ride history requires authentication, returning empty list');
        }
        return [];
      }
      throw error;
    }
  },

  checkZoneRules: async (params: ZoneCheckRequest): Promise<ZoneCheckResult> => {
    const query: Record<string, string | number> = {
      latitude: params.latitude,
      longitude: params.longitude,
    };
    if (params.city) {
      query.city = params.city;
    }
    const response = await scooterApiClient.get<unknown>(ZONE_RULES_PATH, {
      params: query,
    });
    return mapZoneCheckResult(response.data);
  },
};
