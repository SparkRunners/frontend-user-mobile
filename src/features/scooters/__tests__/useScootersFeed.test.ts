import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useScootersFeed } from '../useScootersFeed';
import { fetchScooters } from '../api';

jest.mock('../api', () => ({
  fetchScooters: jest.fn(),
}));

describe('useScootersFeed', () => {
  const mockScooters = [
    {
      id: 1,
      name: 'S1',
      city: 'Sthlm',
      status: 'available',
      speed: 0,
      battery: 80,
      coordinates: { latitude: 1, longitude: 2 },
    },
  ];
  const flushMicrotasks = () => act(async () => {
    await Promise.resolve();
  });
  const createDeferredScooters = () => {
    let resolve!: (value: typeof mockScooters) => void;
    const promise = new Promise<typeof mockScooters>((res) => {
      resolve = res;
    });
    return { promise, resolve };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    (fetchScooters as jest.Mock).mockResolvedValue(mockScooters);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('loads scooters immediately and on interval', async () => {
    const deferred = createDeferredScooters();
    (fetchScooters as jest.Mock)
      .mockResolvedValueOnce(mockScooters)
      .mockReturnValueOnce(deferred.promise);

    const { result } = renderHook(() => useScootersFeed({ intervalMs: 1000 }));

    expect(fetchScooters).toHaveBeenCalledTimes(1);

    await flushMicrotasks();

    expect(result.current.scooters).toEqual(mockScooters);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      deferred.resolve(mockScooters);
      await Promise.resolve();
    });

    expect(fetchScooters).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes refetch for manual trigger', async () => {
    const deferred = createDeferredScooters();
    (fetchScooters as jest.Mock)
      .mockResolvedValueOnce(mockScooters)
      .mockReturnValueOnce(deferred.promise);

    const { result } = renderHook(() => useScootersFeed({ intervalMs: 1000 }));

    await flushMicrotasks();

    let pendingRequest: Promise<void> | undefined;

    await act(async () => {
      pendingRequest = result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await act(async () => {
      deferred.resolve(mockScooters);
      await pendingRequest;
    });

    expect(fetchScooters).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
  });

  it('clears polling when unmounted', async () => {
    const { unmount } = renderHook(() => useScootersFeed({ intervalMs: 1000 }));

    await flushMicrotasks();
    expect(fetchScooters).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(fetchScooters).toHaveBeenCalledTimes(1);
  });
});
