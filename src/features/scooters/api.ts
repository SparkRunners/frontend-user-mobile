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

export const unlockScooter = async (scooterId: number) => {
  // TODO: Replace with real API call when backend is ready
  // const response = await scooterApiClient.post<{ success: boolean; message: string }>(
  //   `/scooters/${scooterId}/unlock`
  // );
  // return response.data;

  // Mock implementation
  return new Promise<{ success: boolean; message: string }>((resolve) => {
    setTimeout(() => {
      console.log(`[Mock] Unlocked scooter ${scooterId}`);
      resolve({ success: true, message: 'Scooter unlocked successfully' });
    }, 1000); // Simulate 1s network delay
  });
};
