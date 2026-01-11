import { scooterApiClient } from '../../api/httpClient';
import { Ride } from './types';

const RENT_BASE_PATH = '/api/v1/rent';

type RentTripDto = {
  id?: string;
  tripId?: string;
  scooterId?: string;
  vehicleId?: string;
  userId?: string;
  riderId?: string;
  startTime?: string;
  startedAt?: string;
  endTime?: string | null;
  completedAt?: string | null;
  status?: string;
  cost?: number;
  totalCost?: number;
  durationSeconds?: number;
  elapsedSeconds?: number;
};

const ensureValue = (value: string | undefined, fallback: string | undefined, label: string) => {
  const resolved = value ?? fallback;
  if (!resolved) {
    throw new Error(`Ride payload missing required field: ${label}`);
  }
  return resolved;
};

const resolveStatus = (payload: RentTripDto): Ride['status'] => {
  const normalized = payload.status?.toLowerCase();
  if (normalized === 'active' || normalized === 'completed' || normalized === 'cancelled') {
    return normalized;
  }
  return payload.endTime || payload.completedAt ? 'completed' : 'active';
};

const mapToRide = (payload: RentTripDto): Ride => {
  if (!payload) {
    throw new Error('Ride payload is empty');
  }

  const id = ensureValue(payload.id, payload.tripId, 'id');
  const scooterId = ensureValue(payload.scooterId, payload.vehicleId, 'scooterId');
  const userId = ensureValue(payload.userId, payload.riderId, 'userId');

  const startTime = payload.startTime ?? payload.startedAt ?? new Date().toISOString();
  const endTime = payload.endTime ?? payload.completedAt ?? undefined;

  return {
    id,
    scooterId,
    userId,
    startTime,
    endTime: endTime ?? undefined,
    status: resolveStatus(payload),
    cost: payload.cost ?? payload.totalCost ?? 0,
    durationSeconds: payload.durationSeconds ?? payload.elapsedSeconds ?? 0,
  };
};

const encodeId = (value: string) => encodeURIComponent(value);

export const rideApi = {
  startRide: async (scooterId: string): Promise<Ride> => {
    const response = await scooterApiClient.post<RentTripDto>(
      `${RENT_BASE_PATH}/start/${encodeId(scooterId)}`,
    );
    return mapToRide(response.data);
  },

  endRide: async (rideId: string): Promise<Ride> => {
    const response = await scooterApiClient.post<RentTripDto>(
      `${RENT_BASE_PATH}/stop/${encodeId(rideId)}`,
    );
    return mapToRide(response.data);
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
    const response = await scooterApiClient.get<RentTripDto[]>(`${RENT_BASE_PATH}/history`);
    return response.data.map(trip => mapToRide(trip));
  },
};
