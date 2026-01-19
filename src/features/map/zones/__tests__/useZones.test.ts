import { renderHook, waitFor } from '@testing-library/react-native';
import { useZones } from '../useZones';
import { scooterApiClient } from '../../../../api/httpClient';

jest.mock('../../../../api/httpClient', () => ({
  scooterApiClient: {
    get: jest.fn(),
  },
}));

const mockScooterApi = scooterApiClient as jest.Mocked<typeof scooterApiClient>;

describe('useZones', () => {
  const mockParkingZone = {
    _id: 'zone-parking-1',
    type: 'parking',
    city: 'Stockholm',
    name: 'Central Parking',
    priority: 10,
    rules: {
      parkingAllowed: true,
      ridingAllowed: false,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [18.063, 59.334],
          [18.064, 59.334],
          [18.064, 59.335],
          [18.063, 59.335],
          [18.063, 59.334],
        ],
      ],
    },
  };

  const mockSlowZone = {
    id: 'zone-slow-1',
    type: 'slow-speed',
    city: 'Stockholm',
    name: 'Pedestrian Area',
    priority: 5,
    rules: {
      maxSpeed: 10,
      ridingAllowed: true,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [18.065, 59.336],
          [18.066, 59.336],
          [18.066, 59.337],
          [18.065, 59.337],
          [18.065, 59.336],
        ],
      ],
    },
  };

  const mockNoGoZone = {
    id: 'zone-nogo-1',
    type: 'no-go',
    name: 'Restricted Zone',
    priority: 20,
    rules: {
      ridingAllowed: false,
      parkingAllowed: false,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [18.067, 59.338],
          [18.068, 59.338],
          [18.068, 59.339],
          [18.067, 59.339],
          [18.067, 59.338],
        ],
      ],
    },
  };

  const mockChargingZone = {
    id: 'zone-charging-1',
    type: 'charging',
    name: 'Charging Station',
    priority: 15,
    geometry: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [18.069, 59.340],
          [18.070, 59.340],
          [18.070, 59.341],
          [18.069, 59.341],
          [18.069, 59.340],
        ],
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Zone Loading', () => {
    it('loads zones successfully on mount', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [mockParkingZone, mockSlowZone, mockNoGoZone, mockChargingZone],
      });

      const { result } = renderHook(() => useZones('Stockholm'));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockScooterApi.get).toHaveBeenCalledWith('/zones', {
        params: { city: 'Stockholm' },
      });

      expect(result.current.parkingZones).toHaveLength(1);
      expect(result.current.slowSpeedZones).toHaveLength(1);
      expect(result.current.noGoZones).toHaveLength(1);
      expect(result.current.chargingZones).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });

    it('handles zones wrapped in data property', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          data: [mockParkingZone],
        },
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.parkingZones).toHaveLength(1);
    });

    it('handles zones wrapped in zones property', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: {
          zones: [mockSlowZone],
        },
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.slowSpeedZones).toHaveLength(1);
    });

    it('defaults to Stockholm when no city provided', async () => {
      mockScooterApi.get.mockResolvedValue({ data: [] });

      renderHook(() => useZones());

      await waitFor(() => {
        expect(mockScooterApi.get).toHaveBeenCalledWith('/zones', {
          params: { city: 'Stockholm' },
        });
      });
    });

    it('normalizes city labels correctly', async () => {
      mockScooterApi.get.mockResolvedValue({ data: [] });

      renderHook(() => useZones('Göteborg'));

      await waitFor(() => {
        expect(mockScooterApi.get).toHaveBeenCalledWith('/zones', {
          params: { city: 'Göteborg' },
        });
      });
    });

    it('handles empty zones array as error', async () => {
      mockScooterApi.get.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Empty array is treated as an error (no zones available)
      expect(result.current.error).toBe('Kunde inte hämta zoner. Försök igen.');
      expect(result.current.parkingZones).toEqual([]);
    });
  });

  describe('Zone Type Normalization', () => {
    it('normalizes slow-speed zone type variants', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [
          { ...mockSlowZone, type: 'slow_speed' },
          { ...mockSlowZone, id: 'zone-2', type: 'slow' },
        ],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.slowSpeedZones).toHaveLength(2);
      });
    });

    it('normalizes no-go zone type variants', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [
          { ...mockNoGoZone, type: 'no_go' },
          { ...mockNoGoZone, id: 'zone-2', type: 'nogo' },
        ],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.noGoZones).toHaveLength(2);
      });
    });

    it('filters out zones with unknown types', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [
          mockParkingZone,
          { ...mockParkingZone, id: 'invalid', type: 'unknown-type' },
        ],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });
    });

    it('filters out zones with Point geometry', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [
          mockParkingZone,
          {
            ...mockParkingZone,
            id: 'point-zone',
            geometry: { type: 'Point', coordinates: [18.063, 59.334] },
          },
        ],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });
    });
  });

  describe('GeoJSON Geometry Processing', () => {
    it('converts Polygon coordinates to PolygonZone format', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [mockParkingZone],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      const zone = result.current.parkingZones[0];
      expect(zone.coordinatesSets).toHaveLength(1);
      expect(zone.coordinatesSets[0][0]).toEqual({
        longitude: 18.063,
        latitude: 59.334,
      });
    });

    it('handles MultiPolygon geometry', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [
          {
            ...mockParkingZone,
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [18.063, 59.334],
                    [18.064, 59.334],
                    [18.064, 59.335],
                    [18.063, 59.334],
                  ],
                ],
                [
                  [
                    [18.070, 59.340],
                    [18.071, 59.340],
                    [18.071, 59.341],
                    [18.070, 59.340],
                  ],
                ],
              ],
            },
          },
        ],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      const zone = result.current.parkingZones[0];
      expect(zone.coordinatesSets).toHaveLength(2);
    });
  });

  describe('Zone Priority Sorting', () => {
    it('sorts zones by priority in ascending order', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [
          { ...mockParkingZone, _id: 'p1', priority: 30 },
          { ...mockParkingZone, _id: 'p2', priority: 10 },
          { ...mockParkingZone, _id: 'p3', priority: 20 },
        ],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(3);
      });

      expect(result.current.parkingZones[0].id).toBe('p2');
      expect(result.current.parkingZones[1].id).toBe('p3');
      expect(result.current.parkingZones[2].id).toBe('p1');
    });

    it('uses default priority 0 when not specified', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [
          { ...mockParkingZone, _id: 'p1', priority: undefined },
          { ...mockParkingZone, _id: 'p2', priority: 5 },
        ],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(2);
      });

      expect(result.current.parkingZones[0].priority).toBe(0);
      expect(result.current.parkingZones[0].id).toBe('p1');
    });
  });

  describe('Zone Rules Mapping', () => {
    it('maps zone rules correctly', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [mockParkingZone],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      expect(result.current.parkingZones[0].rules).toEqual({
        parkingAllowed: true,
        ridingAllowed: false,
      });
    });

    it('returns undefined rules when all fields are undefined', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [
          {
            ...mockParkingZone,
            rules: {},
          },
        ],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      expect(result.current.parkingZones[0].rules).toBeUndefined();
    });

    it('handles zones without rules property', async () => {
      const zoneWithoutRules = { ...mockParkingZone };
      delete (zoneWithoutRules as any).rules;

      mockScooterApi.get.mockResolvedValue({
        data: [zoneWithoutRules],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      expect(result.current.parkingZones[0].rules).toBeUndefined();
    });
  });

  describe('Zone ID Handling', () => {
    it('prefers id over _id', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [
          {
            ...mockParkingZone,
            id: 'preferred-id',
            _id: 'fallback-id',
          },
        ],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      expect(result.current.parkingZones[0].id).toBe('preferred-id');
    });

    it('falls back to _id when id is not present', async () => {
      const zone = { ...mockParkingZone };
      delete (zone as any).id;

      mockScooterApi.get.mockResolvedValue({
        data: [zone],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      expect(result.current.parkingZones[0].id).toBe('zone-parking-1');
    });

    it('generates random ID when both id and _id are missing', async () => {
      const zone = { ...mockParkingZone };
      delete (zone as any).id;
      delete (zone as any)._id;

      mockScooterApi.get.mockResolvedValue({
        data: [zone],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      expect(result.current.parkingZones[0].id).toMatch(/^parking-0\.\d+$/);
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockScooterApi.get.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Kunde inte hämta zoner. Försök igen.');
      expect(result.current.parkingZones).toEqual([]);
      expect(result.current.slowSpeedZones).toEqual([]);
      expect(result.current.noGoZones).toEqual([]);
      expect(result.current.chargingZones).toEqual([]);
    });

    it('logs errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockScooterApi.get.mockRejectedValue(new Error('Network error'));

      renderHook(() => useZones());

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load zones',
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('clears previous data on error', async () => {
      mockScooterApi.get
        .mockResolvedValueOnce({ data: [mockParkingZone] })
        .mockRejectedValueOnce(new Error('Network error'));

      const { result, rerender } = renderHook(
        ({ city }) => useZones(city),
        { initialProps: { city: 'Stockholm' as const } },
      );

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      rerender({ city: 'Göteborg' as const });

      await waitFor(() => {
        expect(result.current.error).toBe('Kunde inte hämta zoner. Försök igen.');
      });

      expect(result.current.parkingZones).toEqual([]);
    });
  });

  describe('Refetch', () => {
    it('refetches zones when refetch is called', async () => {
      mockScooterApi.get
        .mockResolvedValueOnce({ data: [mockParkingZone] })
        .mockResolvedValueOnce({ data: [mockParkingZone, mockSlowZone] });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.parkingZones).toHaveLength(1);
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.slowSpeedZones).toHaveLength(1);
      });

      expect(mockScooterApi.get).toHaveBeenCalledTimes(2);
    });

    it('clears previous error on successful refetch', async () => {
      mockScooterApi.get
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ data: [mockParkingZone] });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.error).toBe('Kunde inte hämta zoner. Försök igen.');
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.parkingZones).toHaveLength(1);
    });
  });

  describe('City Changes', () => {
    it('reloads zones when city changes', async () => {
      mockScooterApi.get.mockResolvedValue({ data: [mockParkingZone] });

      const { rerender } = renderHook(
        ({ city }) => useZones(city),
        { initialProps: { city: 'Stockholm' as const } },
      );

      await waitFor(() => {
        expect(mockScooterApi.get).toHaveBeenCalledWith('/zones', {
          params: { city: 'Stockholm' },
        });
      });

      mockScooterApi.get.mockClear();
      mockScooterApi.get.mockResolvedValue({ data: [mockSlowZone] });

      rerender({ city: 'Göteborg' as const });

      await waitFor(() => {
        expect(mockScooterApi.get).toHaveBeenCalledWith('/zones', {
          params: { city: 'Göteborg' },
        });
      });
    });
  });

  describe('Return Value', () => {
    it('returns correct city value', async () => {
      mockScooterApi.get.mockResolvedValue({ data: [] });

      const { result } = renderHook(() => useZones('Malmö'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.city).toBe('Malmö');
    });

    it('includes all zone types in return value', async () => {
      mockScooterApi.get.mockResolvedValue({
        data: [mockParkingZone, mockSlowZone, mockNoGoZone, mockChargingZone],
      });

      const { result } = renderHook(() => useZones());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('parkingZones');
      expect(result.current).toHaveProperty('slowSpeedZones');
      expect(result.current).toHaveProperty('noGoZones');
      expect(result.current).toHaveProperty('chargingZones');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('refetch');
      expect(result.current).toHaveProperty('city');
    });
  });
});
