import { useCallback, useEffect, useRef, useState } from 'react';
import type { Scooter } from './api';
import { fetchScooters } from './api';
import { runtimeConfig } from '../../config';
import { useSimulationScooters } from './useSimulationScooters';
import type { Region } from 'react-native-maps';

const DEFAULT_INTERVAL_MS = 15_000;

interface ScootersFeedOptions {
  intervalMs?: number;
  /** Current map viewport region (only used for viewport filtering in simulation mode) */
  viewport?: Region | null;
  /** City filter */
  cityFilter?: string;
}

/**
 * Unified scooter data fetching Hook
 * 
 * Automatically selects data source based on configuration:
 * - Simulation mode: Uses Socket.IO real-time push (supports viewport filtering)
 * - Regular mode: Uses REST API polling
 */
export const useScootersFeed = (options?: ScootersFeedOptions) => {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;
  
  // Simulation mode: Use Socket.IO
  const simulationResult = useSimulationScooters({
    viewport: options?.viewport,
    cityFilter: options?.cityFilter,
    enableViewportFilter: false, // Temporarily disable viewport filtering, show all scooters
  });

  // REST mode: Use polling
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchScooters();
      if (!isMountedRef.current) {
        return;
      }
      
      // Apply city filter
      const filtered = options?.cityFilter
        ? data.filter(s => s.city === options.cityFilter)
        : data;
        
      setScooters(filtered);
    } catch (err) {
      console.error('Failed to fetch scooters:', err);
      if (isMountedRef.current) {
        setError('Kunde inte hämta scooters. Försök igen.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [options?.cityFilter]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // If simulation mode is enabled, skip REST API polling
    if (runtimeConfig.simulation.enabled) {
      return;
    }

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

  // Return data based on mode
  if (runtimeConfig.simulation.enabled) {
    return {
      scooters: simulationResult.scooters,
      isLoading: simulationResult.isLoading,
      error: simulationResult.error,
      refetch: () => {
        console.log('[useScootersFeed] No manual refresh needed in simulation mode');
      },
      isSimulationMode: true,
      isConnected: simulationResult.isConnected,
    };
  }

  return {
    scooters,
    isLoading,
    error,
    refetch: load,
    isSimulationMode: false,
    isConnected: false,
  };
};
