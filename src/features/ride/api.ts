import { Ride } from './types';

// Mock delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockHistory: Ride[] = [
  {
    id: 'ride_001',
    scooterId: 'SCOOT-102',
    userId: 'user_123',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 - 1000 * 60 * 18).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    status: 'completed',
    cost: 46,
    durationSeconds: 1080,
  },
  {
    id: 'ride_002',
    scooterId: 'SCOOT-224',
    userId: 'user_123',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 - 1000 * 60 * 25).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: 'completed',
    cost: 52,
    durationSeconds: 1200,
  },
  {
    id: 'ride_003',
    scooterId: 'SCOOT-310',
    userId: 'user_123',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 12).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    status: 'completed',
    cost: 38,
    durationSeconds: 780,
  },
];

export const rideApi = {
  startRide: async (scooterId: string): Promise<Ride> => {
    await delay(1000);
    return {
      id: `ride_${Date.now()}`,
      scooterId,
      userId: 'user_123', // Mock user ID
      startTime: new Date().toISOString(),
      status: 'active',
      cost: 10, // Unlock fee
      durationSeconds: 0,
    };
  },

  endRide: async (rideId: string): Promise<Ride> => {
    await delay(1000);
    // Mock calculation: 10kr base + 2.5kr/min * 15 min = 47.5kr
    const durationSeconds = 900; // 15 mins
    const cost = 10 + (2.5 * (durationSeconds / 60));
    
    return {
      id: rideId,
      scooterId: 'scooter_123',
      userId: 'user_123',
      startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
      endTime: new Date().toISOString(),
      status: 'completed',
      cost,
      durationSeconds,
    };
  },

  getCurrentRide: async (): Promise<Ride | null> => {
    await delay(500);
    // Return null to simulate no active ride initially
    return null;
  },

  getRideHistory: async (): Promise<Ride[]> => {
    await delay(800);
    // Return a shallow copy so downstream consumers can safely mutate
    return mockHistory.map(ride => ({ ...ride }));
  }
};
