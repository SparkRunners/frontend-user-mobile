import { scooterApiClient } from '../../api/httpClient';

export interface ScooterCoordinates {
  latitude: number;
  longitude: number;
}

export interface Scooter {
  id: string;
  name: string;
  city: string;
  status: string;
  battery: number;
  speed: number;
  coordinates: ScooterCoordinates;
}

export interface FetchScootersParams {
  city?: string;
  status?: string;
}

type ScooterApiPayload = Omit<Scooter, 'id'> & {
  id?: string | number;
  _id?: string;
  scooterId?: string | number;
};

const normalizeScooterId = (payload: ScooterApiPayload): string => {
  const raw = payload.id ?? payload._id ?? payload.scooterId;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw;
  }
  if (typeof raw === 'number') {
    return raw.toString();
  }
  return '';
};

const mapScooter = (payload: ScooterApiPayload): Scooter => ({
  ...payload,
  id: normalizeScooterId(payload),
});

export const fetchScooters = async (params?: FetchScootersParams) => {
  const response = await scooterApiClient.get<ScooterApiPayload[]>('/scooters', {
    params,
  });
  return response.data.map(mapScooter);
};

export interface UnlockScooterResponse {
  success: boolean;
  message: string;
}

export const unlockScooter = async (scooterId: string) => {
  const response = await scooterApiClient.post<UnlockScooterResponse>(
    `/scooters/${scooterId}/unlock`,
  );
  return response.data;
};
