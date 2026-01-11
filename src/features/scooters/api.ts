import { scooterApiClient } from '../../api/httpClient';

export interface ScooterCoordinates {
  latitude: number;
  longitude: number;
}

export interface Scooter {
  id: number;
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

export const fetchScooters = async (params?: FetchScootersParams) => {
  const response = await scooterApiClient.get<Scooter[]>('/scooters', {
    params,
  });
  return response.data;
};

export interface UnlockScooterResponse {
  success: boolean;
  message: string;
}

export const unlockScooter = async (scooterId: number) => {
  const response = await scooterApiClient.post<UnlockScooterResponse>(
    `/scooters/${scooterId}/unlock`,
  );
  return response.data;
};
