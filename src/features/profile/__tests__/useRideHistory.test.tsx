import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRideHistory } from '../useRideHistory';
import type { Ride } from '../../ride';
import { rideApi } from '../../ride';

jest.mock('../../ride', () => {
  const originalModule = jest.requireActual('../../ride');
  return {
    __esModule: true,
    ...originalModule,
    rideApi: {
      getRideHistory: jest.fn(),
    },
  };
});

const mockHistory: Ride[] = [
  {
    id: 'ride-test-1',
    scooterId: 'SCOOT-001',
    userId: 'user_123',
    startTime: new Date(2024, 5, 1, 10, 0, 0).toISOString(),
    endTime: new Date(2024, 5, 1, 10, 20, 0).toISOString(),
    status: 'completed',
    cost: 42,
    durationSeconds: 1200,
  },
];

const getRideHistoryMock = rideApi.getRideHistory as jest.Mock;

describe('useRideHistory', () => {
  beforeEach(() => {
    getRideHistoryMock.mockReset();
  });

  it('loads ride history on mount', async () => {
    getRideHistoryMock.mockResolvedValue(mockHistory);
    const { result } = renderHook(() => useRideHistory());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rides).toEqual(mockHistory);
    expect(result.current.error).toBeNull();
    expect(getRideHistoryMock).toHaveBeenCalledTimes(1);
  });

  it('sets error state and allows manual refetch', async () => {
    getRideHistoryMock.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useRideHistory());

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.rides).toEqual([]);

    getRideHistoryMock.mockResolvedValueOnce(mockHistory);
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.rides).toEqual(mockHistory);
    expect(result.current.error).toBeNull();
    expect(getRideHistoryMock).toHaveBeenCalledTimes(2);
  });
});
