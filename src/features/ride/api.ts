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

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const extractIdentifier = (value: unknown): string | undefined => {
  const direct = asNonEmptyString(value);
  if (direct) {
    return direct;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return (
      asNonEmptyString(record.id) ??
      asNonEmptyString(record._id) ??
      asNonEmptyString(record.identifier) ??
      asNonEmptyString(record.code) ??
      asNonEmptyString(record.name) ??
      asNonEmptyString(record.number)
    );
  }
  return undefined;
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
    const stringValue = extractIdentifier(value);
    if (stringValue) {
      return stringValue;
    }
  }
  return undefined;
};

const readNestedIdentifier = (
  payload: RentTripDto | null | undefined,
  containerKeys: string[],
): string | undefined => {
  if (!payload) {
    return undefined;
  }
  const record = payload as Record<string, unknown>;
  for (const containerKey of containerKeys) {
    const nested = record[containerKey];
    const identifier = extractIdentifier(nested);
    if (identifier) {
      return identifier;
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
  const scooterIdFromPayload =
    readStringField(payload, 'scooterId', 'scooter_id', 'scooterID', 'vehicleId', 'scooter') ??
    readNestedIdentifier(payload, ['scooter', 'vehicle', 'asset', 'bike']);
  const scooterId = ensureValue(
    scooterIdFromPayload,
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

const mapZoneCheckResult = (payload: unknown): ZoneCheckResult => {
  const source = extractZoneRulePayload(payload);
  if (!source) {
    return { rule: null, nearestParking: null };
  }

  // Backend format: { inZone, rules: { parkAllowed, rideAllowed, maxSpeed, hasCharging }, alert }
  let rule: ZoneRuleMatch | null = null;

  // If outside all zones, allow normal riding (no restrictions)
  if (source.inZone === false || !source.rules) {
    rule = null;
  } else if (source.rules && typeof source.rules === 'object') {
    const rules = source.rules as GenericRecord;
    const rideAllowed = rules.rideAllowed === true;
    const parkAllowed = rules.parkAllowed === true;
    const maxSpeed = readNumber(rules, 'maxSpeed');
    const hasCharging = rules.hasCharging === true;

    if (!rideAllowed) {
      // No-go zone (riding not allowed within this zone)
      rule = {
        type: 'no-go',
        priority: 100,
        message: 'Du är i en förbjuden zon. Flytta skotern till tillåten plats.',
        speedLimitKmh: undefined,
      };
    } else if (maxSpeed && maxSpeed > 0 && maxSpeed < 25) {
      // Slow-speed zone (only if maxSpeed is positive and less than normal speed)
      rule = {
        type: 'slow-speed',
        priority: 50,
        message: `Låg-hastighetszon. Max hastighet: ${maxSpeed} km/h`,
        speedLimitKmh: maxSpeed,
      };
    } else if (parkAllowed) {
      // Parking zone
      rule = {
        type: 'parking',
        priority: 30,
        message: 'Du är i en parkeringszon.',
        speedLimitKmh: undefined,
      };
    } else if (hasCharging) {
      // Charging zone
      rule = {
        type: 'charging',
        priority: 40,
        message: 'Du är i en laddzon.',
        speedLimitKmh: undefined,
      };
    }
  }

  // Backend doesn't provide nearestParking yet
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

type RideApiErrorInfo = {
  status?: number;
  message?: string;
  data?: Record<string, unknown>;
};

const extractRideApiError = (error: unknown): RideApiErrorInfo | null => {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const response = (error as { response?: { status?: number; data?: unknown } }).response;
  if (!response) {
    return null;
  }
  const data =
    response.data && typeof response.data === 'object'
      ? (response.data as Record<string, unknown>)
      : undefined;
  const message = (() => {
    const dataMessage = typeof data?.message === 'string' ? data.message : undefined;
    if (dataMessage) {
      return dataMessage;
    }
    const dataError = typeof data?.error === 'string' ? data.error : undefined;
    if (dataError) {
      return dataError;
    }
    return undefined;
  })();
  return {
    status: response.status,
    message,
    data,
  };
};

const containsKeyword = (source: string | undefined, keyword: string) => {
  if (!source) {
    return false;
  }
  return source.toLowerCase().includes(keyword.toLowerCase());
};

const hasBalanceSignal = (info: RideApiErrorInfo | null) => {
  if (!info) {
    return false;
  }
  if (containsKeyword(info.message, 'balance') || containsKeyword(info.message, 'saldo')) {
    return true;
  }
  const data = info.data;
  if (!data) {
    return false;
  }
  if ('balance' in data || 'cost' in data) {
    return true;
  }
  const dataMessage = typeof data.message === 'string' ? data.message : undefined;
  const dataError = typeof data.error === 'string' ? data.error : undefined;
  return containsKeyword(dataMessage ?? dataError, 'balance');
};

const isActiveRideConflict = (info: RideApiErrorInfo | null) => {
  if (!info) {
    return false;
  }
  if (info.status === 409) {
    return true;
  }
  return containsKeyword(info.message, 'active ride') || containsKeyword(info.message, 'ongoing ride');
};

const resolveRideErrorMessage = (
  phase: 'start' | 'stop',
  info: RideApiErrorInfo | null,
): string | null => {
  if (!info) {
    return null;
  }

  if (hasBalanceSignal(info)) {
    return phase === 'start'
      ? 'Saldo räcker inte för att låsa upp. Fyll på ditt konto och försök igen.'
      : 'Saldo räcker inte för att avsluta resan. Fyll på ditt konto och försök igen.';
  }

  if (isActiveRideConflict(info)) {
    return 'Du har redan en pågående resa. Avsluta den innan du låser upp en ny.';
  }

  return info.message ?? null;
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
      const friendlyMessage = resolveRideErrorMessage('start', extractRideApiError(error));
      if (friendlyMessage) {
        throw new Error(friendlyMessage);
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
      const friendlyMessage = resolveRideErrorMessage('stop', extractRideApiError(error));
      if (friendlyMessage) {
        throw new Error(friendlyMessage);
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
