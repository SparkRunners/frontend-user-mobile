import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import type { Ride } from '../../ride';
import { useRideHistory } from '../useRideHistory';

jest.mock('../useRideHistory');

const mockUseRideHistory = useRideHistory as jest.MockedFunction<typeof useRideHistory>;

const sampleRide: Ride = {
  id: 'ride-ui-1',
  scooterId: 'SCOOT-500',
  userId: 'user_123',
  startTime: new Date(2024, 4, 1, 12, 12, 0).toISOString(),
  endTime: new Date(2024, 4, 1, 12, 25, 0).toISOString(),
  status: 'completed',
  cost: 48,
  durationSeconds: 780,
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockUseRideHistory.mockReset();
  });

  it('renders ride history items', () => {
    mockUseRideHistory.mockReturnValue({
      rides: [sampleRide],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { getByText } = render(<ProfileScreen />);

    expect(getByText('My Trips')).toBeTruthy();
    expect(getByText('SCOOT-500')).toBeTruthy();
    expect(getByText(/48 kr/)).toBeTruthy();
  });

  it('shows loader and empty state when there are no rides yet', () => {
    mockUseRideHistory.mockReturnValue({
      rides: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    const { getByTestId } = render(<ProfileScreen />);

    expect(getByTestId('ride-history-loader')).toBeTruthy();
  });

  it('invokes refetch when tapping Uppdatera and displays errors', () => {
    const refetch = jest.fn();
    mockUseRideHistory.mockReturnValue({
      rides: [],
      isLoading: false,
      error: 'Oops',
      refetch,
    });

    const { getByText } = render(<ProfileScreen />);

    fireEvent.press(getByText('Uppdatera'));
    expect(refetch).toHaveBeenCalled();
    expect(getByText('Oops')).toBeTruthy();
    expect(getByText('Du har inga resor ännu.')).toBeTruthy();
  });
});
