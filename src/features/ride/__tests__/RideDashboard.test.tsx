import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RideDashboard } from '../RideDashboard';
import { useRide } from '../RideProvider';
import { Alert } from 'react-native';

// Mock useRide hook
jest.mock('../RideProvider', () => ({
  useRide: jest.fn(),
}));

describe('RideDashboard', () => {
  const mockEndRide = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRide as jest.Mock).mockReturnValue({
      durationSeconds: 65, // 1 min 5 sec
      currentCost: 12.5,
      endRide: mockEndRide,
      isLoading: false,
    });
  });

  it('renders duration and cost correctly', () => {
    const { getByText } = render(<RideDashboard />);

    expect(getByText('01:05')).toBeTruthy();
    expect(getByText('12.50 kr')).toBeTruthy();
  });

  it('shows confirmation alert when end ride button is pressed', () => {
    const spyAlert = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<RideDashboard />);

    fireEvent.press(getByText('Avsluta resa'));

    expect(spyAlert).toHaveBeenCalledWith(
      'Avsluta resa',
      'Är du säker på att du vill avsluta resan?',
      expect.any(Array)
    );
  });

  it('disables button when loading', () => {
    (useRide as jest.Mock).mockReturnValue({
      durationSeconds: 65,
      currentCost: 12.5,
      endRide: mockEndRide,
      isLoading: true,
    });

    const { getByText } = render(<RideDashboard />);
    
    expect(getByText('Avslutar...')).toBeTruthy();
  });
});
