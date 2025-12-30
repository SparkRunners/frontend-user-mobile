import { Ride } from './types';

// Mock delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  }
};
