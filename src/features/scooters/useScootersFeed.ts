import { useCallback, useEffect, useRef, useState } from 'react';
import type { Scooter } from './api';
import { fetchScooters } from './api';

const DEFAULT_INTERVAL_MS = 15_000;

interface ScootersFeedOptions {
  intervalMs?: number;
}

export const useScootersFeed = (options?: ScootersFeedOptions) => {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchScooters();
      setScooters(data);
    } catch (err) {
      console.error('Failed to fetch scooters:', err);
      setError('Kunde inte hämta scooters. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      await load();
      if (cancelled) return;
      timerRef.current = setInterval(load, intervalMs);
    };
    bootstrap();
    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [load, intervalMs]);

  return {
    scooters,
    isLoading,
    error,
    refetch: load,
  };
};
