import { scooterApiClient } from '../../api/httpClient';

export interface ScooterLocation {
  latitude: number;
  longitude: number;
}

export interface Scooter {
  id: string;
  label?: string;
  city?: string;
  status: string;
  battery: number;
  speed: number;
  location: ScooterLocation;
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
