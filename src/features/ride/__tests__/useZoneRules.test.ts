import { act, renderHook, waitFor } from '@testing-library/react-native';
import Geolocation from '@react-native-community/geolocation';
import { rideApi } from '../api';
import { MIN_FETCH_INTERVAL_MS, useRideZoneRules } from '../useZoneRules';

jest.mock('../api', () => ({
  rideApi: {
    checkZoneRules: jest.fn(),
  },
}));

jest.mock('@react-native-community/geolocation', () => ({
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  getCurrentPosition: jest.fn(),
  requestAuthorization: jest.fn(),
  stopObserving: jest.fn(),
}));

const mockCheckZoneRules = rideApi.checkZoneRules as jest.Mock;
const mockWatchPosition = Geolocation.watchPosition as jest.Mock;
const mockClearWatch = Geolocation.clearWatch as jest.Mock;

type MockPosition = {
  coords: {
    latitude: number;
    longitude: number;
  };
};

describe('useRideZoneRules', () => {
  let successCallback: ((position: MockPosition) => void) | null;
  let nowSpy: jest.SpyInstance<number, []>;
  let currentTime = MIN_FETCH_INTERVAL_MS + 1_000;

  const emitPosition = (latitude: number, longitude: number) => {
    const callback = successCallback;
    if (!callback) {
      throw new Error('watchPosition success callback missing');
    }
    act(() => {
      callback({
        coords: { latitude, longitude },
      });
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockCheckZoneRules.mockResolvedValue({ rule: null, nearestParking: null });
    successCallback = null;
    currentTime = MIN_FETCH_INTERVAL_MS + 1_000;
    mockWatchPosition.mockImplementation((success: (position: MockPosition) => void) => {
      successCallback = success;
      return 1;
    });
    mockClearWatch.mockReturnValue(undefined);

    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
  });

  afterEach(() => {
    jest.useRealTimers();
    mockCheckZoneRules.mockReset();
    mockWatchPosition.mockReset();
    mockClearWatch.mockReset();
    successCallback = null;
    nowSpy.mockRestore();
  });

  it('starts a geolocation watch and updates rule results when riding', async () => {
    const zoneResult = {
      rule: { type: 'slow-speed', priority: 40, message: 'Max 15 km/h' },
      nearestParking: { id: 'park-1', coordinate: { latitude: 59.3, longitude: 18.06 } },
    };
    mockCheckZoneRules.mockResolvedValue(zoneResult);

    const { result } = renderHook(() => useRideZoneRules(true));

    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
    emitPosition(59.33, 18.05);

    await waitFor(() => {
      expect(mockCheckZoneRules).toHaveBeenCalledWith({ latitude: 59.33, longitude: 18.05 });
      expect(result.current.rule).toEqual(zoneResult.rule);
      expect(result.current.nearestParking).toEqual(zoneResult.nearestParking);
      expect(result.current.lastUpdated).not.toBeNull();
    });
  });

  it('throttles repeated updates but forceRefresh bypasses the interval', async () => {
    const { result } = renderHook(() => useRideZoneRules(true));

    emitPosition(1, 2);
    await waitFor(() => expect(mockCheckZoneRules).toHaveBeenCalledTimes(1));

    emitPosition(3, 4);
    await waitFor(() => expect(mockCheckZoneRules).toHaveBeenCalledTimes(1));

    currentTime += MIN_FETCH_INTERVAL_MS + 10;
    emitPosition(5, 6);
    await waitFor(() => expect(mockCheckZoneRules).toHaveBeenCalledTimes(2));

    act(() => {
      result.current.forceRefresh();
    });
    await waitFor(() => expect(mockCheckZoneRules).toHaveBeenCalledTimes(3));
  });
});
