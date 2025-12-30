export interface Ride {
  id: string;
  scooterId: string;
  userId: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  status: 'active' | 'completed' | 'cancelled';
  cost: number;
  durationSeconds: number;
}

export interface RideStatus {
  isRiding: boolean;
  currentRide: Ride | null;
}
