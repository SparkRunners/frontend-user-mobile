import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import type { Ride } from '../../ride';
import { useRideHistory } from '../useRideHistory';
import { useBalance } from '../useBalance';

jest.mock('../useRideHistory');
jest.mock('../useBalance');

const mockUseRideHistory = useRideHistory as jest.MockedFunction<typeof useRideHistory>;
const mockUseBalance = useBalance as jest.MockedFunction<typeof useBalance>;

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
    mockUseBalance.mockReset();
    
    // Default mock for useBalance
    mockUseBalance.mockReturnValue({
      balance: 150,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      fillup: jest.fn(),
    });
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

    const { getAllByText, getByText } = render(<ProfileScreen />);

    // Get all "Uppdatera" buttons and press the last one (ride history)
    const updateButtons = getAllByText('Uppdatera');
    fireEvent.press(updateButtons[updateButtons.length - 1]);
    
    expect(refetch).toHaveBeenCalled();
    expect(getByText('Oops')).toBeTruthy();
    expect(getByText('Du har inga resor ännu.')).toBeTruthy();
  });
});
