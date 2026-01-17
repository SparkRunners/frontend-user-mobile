import { useCallback, useEffect, useState } from 'react';
import { Ride, rideApi } from '../ride';

interface RideHistoryState {
  rides: Ride[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRideHistory = (): RideHistoryState => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    console.log('[useRideHistory] Starting to load history...');
    setIsLoading(true);
    setError(null);
    try {
      const data = await rideApi.getRideHistory();
      console.log('[useRideHistory] Loaded rides:', data.length);
      setRides(data);
    } catch (err) {
      console.error('[useRideHistory] Failed to fetch ride history', err);
      setError('Kunde inte hämta tidigare resor. Försök igen.');
    } finally {
      setIsLoading(false);
      console.log('[useRideHistory] Load complete');
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    rides,
    isLoading,
    error,
    refetch: loadHistory,
  };
};
