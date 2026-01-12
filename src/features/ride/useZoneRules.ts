import { useCallback, useEffect, useRef, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { rideApi } from './api';
import type { ParkingHint, ZoneRuleMatch } from './types';

type PositionOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
};

export const MIN_FETCH_INTERVAL_MS = 8000;
const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 1_000,
};

type SimpleCoords = {
  latitude: number;
  longitude: number;
};

export interface UseRideZoneRulesResult {
  rule: ZoneRuleMatch | null;
  nearestParking: ParkingHint | null;
  isChecking: boolean;
  error: string | null;
  lastUpdated: number | null;
  forceRefresh: () => void;
}

export const useRideZoneRules = (isRiding: boolean): UseRideZoneRulesResult => {
  const [rule, setRule] = useState<ZoneRuleMatch | null>(null);
  const [nearestParking, setNearestParking] = useState<ParkingHint | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const lastCoordsRef = useRef<SimpleCoords | null>(null);
  const lastFetchRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null && typeof Geolocation.clearWatch === 'function') {
      Geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      clearWatch();
    };
  }, [clearWatch]);

  const requestCheck = useCallback(
    async (coords?: SimpleCoords | null, force = false) => {
      if (!coords) {
        return;
      }

      const now = Date.now();
      if (!force && now - lastFetchRef.current < MIN_FETCH_INTERVAL_MS) {
        return;
      }

      lastFetchRef.current = now;
      setIsChecking(true);
      try {
        const result = await rideApi.checkZoneRules(coords);
        if (!mountedRef.current) {
          return;
        }
        setRule(result.rule);
        setNearestParking(result.nearestParking);
        setError(null);
        setLastUpdated(Date.now());
      } catch (err) {
        console.warn('Failed to check zone rules', err);
        if (mountedRef.current) {
          setError('Kunde inte kontrollera zonregler just nu.');
        }
      } finally {
        if (mountedRef.current) {
          setIsChecking(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!isRiding) {
      clearWatch();
      return;
    }

    if (typeof Geolocation.watchPosition !== 'function') {
      setError('Platsdelning stöds inte på den här enheten.');
      return;
    }

    setError(null);
    const watchId = Geolocation.watchPosition(
      position => {
        const coords: SimpleCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        lastCoordsRef.current = coords;
        requestCheck(coords).catch(err => {
          console.warn('Failed to refresh zone rules from watcher', err);
        });
      },
      watchError => {
        console.warn('ride zone watch error', watchError);
        setError('Kunde inte läsa din position. Kontrollera behörigheterna.');
      },
      WATCH_OPTIONS,
    );

    watchIdRef.current = watchId;

    return () => {
      if (typeof Geolocation.clearWatch === 'function') {
        Geolocation.clearWatch(watchId);
      }
      watchIdRef.current = null;
    };
  }, [clearWatch, isRiding, requestCheck]);

  const forceRefresh = useCallback(() => {
    requestCheck(lastCoordsRef.current, true).catch(err => {
      console.warn('Failed to refresh zone rules manually', err);
    });
  }, [requestCheck]);

  return {
    rule,
    nearestParking,
    isChecking,
    error,
    lastUpdated,
    forceRefresh,
  };
};
