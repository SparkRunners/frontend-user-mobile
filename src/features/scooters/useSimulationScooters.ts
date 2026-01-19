import { useCallback, useEffect, useRef, useState } from 'react';
import { simulationSocket } from '../../api/simulationSocket';
import type { Scooter } from './api';
import type { Region } from 'react-native-maps';


const normalizeScooterId = (payload: any): string => {
  const raw = payload.id ?? payload._id ?? payload.scooterId;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw;
  }
  if (typeof raw === 'number') {
    return raw.toString();
  }
  return '';
};

const normalizeScooter = (payload: any): Scooter | null => {
  const id = normalizeScooterId(payload);
  if (!id) {
    console.warn('[useSimulationScooters] Scooter missing valid ID:', payload);
    return null;
  }
  return {
    ...payload,
    id,
  };
};

interface ViewportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Calculate bounds from map viewport
 */
const calculateBounds = (region: Region | null): ViewportBounds | null => {
  if (!region) return null;

  return {
    minLat: region.latitude - region.latitudeDelta / 2,
    maxLat: region.latitude + region.latitudeDelta / 2,
    minLng: region.longitude - region.longitudeDelta / 2,
    maxLng: region.longitude + region.longitudeDelta / 2,
  };
};

/**
 * Check if scooter is within viewport
 */
const isInViewport = (scooter: Scooter, bounds: ViewportBounds | null): boolean => {
  if (!bounds) return true; // No boundary restrictions, show all scooters

  const lat = scooter.coordinates.latitude;
  const lng = scooter.coordinates.longitude;

  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
};

interface UseSimulationScootersOptions {
  /** Current map viewport region */
  viewport?: Region | null;
  /** Enable viewport filtering (default true) */
  enableViewportFilter?: boolean;
  /** City filter */
  cityFilter?: string;
}

/**
 * Real-time simulation scooter data using Socket.IO
 * 
 * Performance optimizations:
 * 1. Viewport filtering - Only render scooters in visible area
 * 2. Map data structure - O(1) time complexity for updates
 * 3. Avoid full re-renders
 */
export const useSimulationScooters = (options?: UseSimulationScootersOptions) => {
  const {
    viewport = null,
    enableViewportFilter = true,
    cityFilter,
  } = options ?? {};

  const [allScooters, setAllScooters] = useState<Scooter[]>([]);
  const [visibleScooters, setVisibleScooters] = useState<Scooter[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Use Map to store scooter data for fast updates
  const scootersMapRef = useRef<Map<string, Scooter>>(new Map());
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const updateThrottleMs = 5000; // Maximum update frequency: once per 5 seconds

  // Handle Socket pushed scooter data
  const handleScootersUpdate = useCallback((scooters: Scooter[]) => {
    if (!isMountedRef.current) return;

    // Normalize and update Map (incremental update, not full replacement)
    scooters.forEach(rawScooter => {
      const scooter = normalizeScooter(rawScooter);
      if (scooter) {
        scootersMapRef.current.set(scooter.id, scooter);
      }
    });

    // Throttle: Limit rendering frequency
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < updateThrottleMs) {
      return; // Skip this render update
    }
    lastUpdateTimeRef.current = now;

    const allScootersArray = Array.from(scootersMapRef.current.values());

    // Apply city filter
    const filteredByCity = cityFilter
      ? allScootersArray.filter(s => s.city === cityFilter)
      : allScootersArray;

    setAllScooters(filteredByCity);
    setIsLoading(false);
    setError(null);
  }, [cityFilter]);

  // Connect to Socket.IO
  useEffect(() => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      simulationSocket.connect();
      setIsConnected(simulationSocket.isConnected());

      const unsubscribe = simulationSocket.subscribe(handleScootersUpdate);

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.error('[useSimulationScooters] Connection failed:', err);
      setError('Unable to connect to simulation server');
      setIsLoading(false);
    }
  }, [handleScootersUpdate]);

  // Filter visible scooters by viewport
  useEffect(() => {
    if (!enableViewportFilter) {
      setVisibleScooters(allScooters);
      return;
    }

    const bounds = calculateBounds(viewport);
    const filtered = allScooters.filter(scooter => isInViewport(scooter, bounds));


    setVisibleScooters(filtered);
  }, [allScooters, viewport, enableViewportFilter]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    /** All scooters (after applying city filter) */
    allScooters,
    /** Scooters visible in viewport */
    scooters: visibleScooters,
    isConnected,
    isLoading,
    error,
  };
};
