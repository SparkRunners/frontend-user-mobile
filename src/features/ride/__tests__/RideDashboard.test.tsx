import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { RideDashboard } from '../RideDashboard';
import { useRide } from '../RideProvider';
import { useRideZoneRules } from '../useZoneRules';
import { Alert } from 'react-native';

// Mock useRide hook
jest.mock('../RideProvider', () => ({
  useRide: jest.fn(),
}));

jest.mock('../useZoneRules', () => ({
  useRideZoneRules: jest.fn(),
}));

describe('RideDashboard', () => {
  const mockEndRide = jest.fn();
  const mockForceRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRide as jest.Mock).mockReturnValue({
      durationSeconds: 65, // 1 min 5 sec
      currentCost: 12.5,
      endRide: mockEndRide,
      isLoading: false,
      isRiding: true,
    });
    (useRideZoneRules as jest.Mock).mockReturnValue({
      rule: null,
      nearestParking: null,
      isChecking: false,
      error: null,
      lastUpdated: null,
      forceRefresh: mockForceRefresh,
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
      expect.stringContaining('Är du säker på att du vill avsluta resan?'),
      expect.any(Array)
    );
  });

  it('disables button when loading', () => {
    (useRide as jest.Mock).mockReturnValue({
      durationSeconds: 65,
      currentCost: 12.5,
      endRide: mockEndRide,
      isLoading: true,
      isRiding: true,
    });

    const { getByText } = render(<RideDashboard />);
    
    expect(getByText('Avslutar...')).toBeTruthy();
  });

  it('renders zone warning message and parking hint', () => {
    (useRideZoneRules as jest.Mock).mockReturnValue({
      rule: { type: 'slow-speed', priority: 60, message: 'Max 15 km/h', speedLimitKmh: 15 },
      nearestParking: { id: 'park-1', name: 'Centralen', coordinate: { latitude: 0, longitude: 0 } },
      isChecking: false,
      error: null,
      lastUpdated: Date.now(),
      forceRefresh: mockForceRefresh,
    });

    const { getByText } = render(<RideDashboard />);

    expect(getByText('Låg hastighet')).toBeTruthy();
    expect(getByText(/Centralen/)).toBeTruthy();
  });

  it('includes parking suggestion in alert when present', () => {
    (useRideZoneRules as jest.Mock).mockReturnValue({
      rule: null,
      nearestParking: { id: 'park-9', coordinate: { latitude: 0, longitude: 0 }, distanceMeters: 120 },
      isChecking: false,
      error: null,
      lastUpdated: null,
      forceRefresh: mockForceRefresh,
    });

    const spyAlert = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<RideDashboard />);

    fireEvent.press(getByText('Avsluta resa'));

    expect(spyAlert).toHaveBeenCalledWith(
      'Avsluta resa',
      expect.stringContaining('parkering'),
      expect.any(Array),
    );
  });

  it('renders no-go zone messaging when rule is blocking', () => {
    (useRideZoneRules as jest.Mock).mockReturnValue({
      rule: { type: 'no-go', priority: 90 },
      nearestParking: null,
      isChecking: false,
      error: null,
      lastUpdated: null,
      forceRefresh: mockForceRefresh,
    });

    const { getByText } = render(<RideDashboard />);

    expect(getByText('Förbjuden zon')).toBeTruthy();
    expect(getByText(/Du är i en förbjuden zon/)).toBeTruthy();
  });

  it('shows zone error banner and allows retry', () => {
    const errorMessage = 'Kunde inte kontrollera zonregler just nu.';
    (useRideZoneRules as jest.Mock).mockReturnValue({
      rule: null,
      nearestParking: null,
      isChecking: false,
      error: errorMessage,
      lastUpdated: null,
      forceRefresh: mockForceRefresh,
    });

    const { getByText, getByTestId } = render(<RideDashboard />);

    expect(getByText(errorMessage)).toBeTruthy();
    expect(getByText('Tryck för att uppdatera zonstatus')).toBeTruthy();

    fireEvent.press(getByTestId('zone-status-banner'));
    expect(mockForceRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows backend error message when end ride fails', async () => {
    const errorMessage = 'Saldo räcker inte för att avsluta resan. Fyll på ditt konto och försök igen.';
    const rejectingEndRide = jest.fn().mockRejectedValue(new Error(errorMessage));
    (useRide as jest.Mock).mockReturnValue({
      durationSeconds: 65,
      currentCost: 12.5,
      endRide: rejectingEndRide,
      isLoading: false,
      isRiding: true,
    });

    const spyAlert = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<RideDashboard />);

    fireEvent.press(getByText('Avsluta resa'));
    const buttons = spyAlert.mock.calls[0]?.[2];
    const confirm = buttons?.find(button => button.style === 'destructive');

    await act(async () => {
      await confirm?.onPress?.();
    });

    expect(spyAlert.mock.calls[1]).toEqual(['Fel', errorMessage, undefined]);
  });
});
