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
    setIsLoading(true);
    setError(null);
    try {
      const data = await rideApi.getRideHistory();
      setRides(data);
    } catch (err) {
      console.error('Failed to fetch ride history', err);
      setError('Kunde inte hämta tidigare resor. Försök igen.');
    } finally {
      setIsLoading(false);
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
