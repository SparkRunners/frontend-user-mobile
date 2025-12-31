import { renderHook, act } from '@testing-library/react-native';
import { useScootersFeed } from '../useScootersFeed';
import { fetchScooters } from '../api';

jest.mock('../api', () => ({
  fetchScooters: jest.fn(),
}));

describe('useScootersFeed', () => {
  const mockScooters = [
    { id: 1, name: 'S1', city: 'Sthlm', status: 'available', speed: 0, battery: 80, coordinates: { latitude: 1, longitude: 2 } },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    (fetchScooters as jest.Mock).mockResolvedValue(mockScooters);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('loads scooters immediately and on interval', async () => {
    const { result } = renderHook(() => useScootersFeed({ intervalMs: 1000 }));

    expect(fetchScooters).toHaveBeenCalledTimes(1);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.scooters).toEqual(mockScooters);

    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(fetchScooters).toHaveBeenCalledTimes(2);
  });

  it('exposes refetch for manual trigger', async () => {
    const { result } = renderHook(() => useScootersFeed({ intervalMs: 1000 }));

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetchScooters).toHaveBeenCalledTimes(2);
  });
});
