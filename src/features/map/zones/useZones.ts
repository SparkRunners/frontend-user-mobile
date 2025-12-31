import { useMemo } from 'react';
import type { Zone } from './types';
import { mockZones } from './mockZones';

interface UseZonesResult {
  zones: Zone[];
  parkingZones: Zone[];
  allowedZones: Zone[];
  isLoading: boolean;
  error: string | null;
}

export const useZones = (): UseZonesResult => {
  const allowedZones = useMemo(
    () => mockZones.filter(zone => zone.kind === 'allowed'),
    [],
  );
  const parkingZones = useMemo(
    () => mockZones.filter(zone => zone.kind === 'parking'),
    [],
  );

  return {
    zones: mockZones,
    parkingZones,
    allowedZones,
    isLoading: false,
    error: null,
  };
};
