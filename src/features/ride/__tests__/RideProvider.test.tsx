import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { RideProvider, useRide } from '../RideProvider';
import { rideApi } from '../api';

// Mock the API
jest.mock('../api', () => ({
  rideApi: {
    startRide: jest.fn(),
    endRide: jest.fn(),
    getCurrentRide: jest.fn(),
  },
}));

describe('RideProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RideProvider>{children}</RideProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useRide(), { wrapper });

    expect(result.current.isRiding).toBe(false);
    expect(result.current.currentRide).toBeNull();
    expect(result.current.durationSeconds).toBe(0);
    expect(result.current.currentCost).toBe(0);
  });

  it('starts a ride successfully', async () => {
    const mockRide = {
      id: 'ride_123',
      scooterId: 'scooter_1',
      userId: 'user_1',
      startTime: new Date().toISOString(),
      status: 'active',
      cost: 10,
      durationSeconds: 0,
    };

    (rideApi.startRide as jest.Mock).mockResolvedValue(mockRide);

    const { result } = renderHook(() => useRide(), { wrapper });

    await act(async () => {
      await result.current.startRide('scooter_1');
    });

    expect(rideApi.startRide).toHaveBeenCalledWith('scooter_1');
    expect(result.current.isRiding).toBe(true);
    expect(result.current.currentRide).toEqual(mockRide);
  });

  it('ends a ride successfully', async () => {
    const mockRide = {
      id: 'ride_123',
      scooterId: 'scooter_1',
      userId: 'user_1',
      startTime: new Date().toISOString(),
      status: 'active',
      cost: 10,
      durationSeconds: 0,
    };

    (rideApi.startRide as jest.Mock).mockResolvedValue(mockRide);
    (rideApi.endRide as jest.Mock).mockResolvedValue({ ...mockRide, status: 'completed' });

    const { result } = renderHook(() => useRide(), { wrapper });

    // Start ride first
    await act(async () => {
      await result.current.startRide('scooter_1');
    });

    expect(result.current.isRiding).toBe(true);

    // End ride
    await act(async () => {
      await result.current.endRide();
    });

    expect(rideApi.endRide).toHaveBeenCalledWith('ride_123');
    expect(result.current.isRiding).toBe(false);
    expect(result.current.currentRide).toBeNull();
    expect(result.current.durationSeconds).toBe(0);
  });
});
