import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TripSummary } from '../TripSummary';
import { useRide } from '../RideProvider';

const mockedUseRide = useRide as jest.MockedFunction<typeof useRide>;

jest.mock('../RideProvider', () => ({
  useRide: jest.fn(),
}));

const createContextValue = (overrides: Partial<ReturnType<typeof useRide>>) => ({
  currentRide: null,
  lastRide: null,
  isRiding: false,
  durationSeconds: 0,
  currentCost: 0,
  startRide: jest.fn(),
  endRide: jest.fn(),
  clearLastRide: jest.fn(),
  isLoading: false,
  ...overrides,
}) as ReturnType<typeof useRide>;

describe('TripSummary', () => {
  const mockClearLastRide = jest.fn();
  const baseRide = {
    id: 'ride-777',
    scooterId: 'SCOOT-77',
    userId: 'user-42',
    startTime: '2025-01-01T12:00:00.000Z',
    endTime: '2025-01-01T12:15:00.000Z',
    status: 'completed' as const,
    cost: 47.5,
    durationSeconds: 125,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClearLastRide.mockReset();
  });

  it('renders nothing when there is no completed ride', () => {
    mockedUseRide.mockReturnValue(
      createContextValue({
        lastRide: null,
        clearLastRide: mockClearLastRide,
      }),
    );

    const { queryByText } = render(<TripSummary />);

    expect(queryByText('Resa avslutad!')).toBeNull();
  });

  it('displays formatted stats for the latest ride', () => {
    mockedUseRide.mockReturnValue(
      createContextValue({
        lastRide: baseRide,
        clearLastRide: mockClearLastRide,
      }),
    );

    const { getByText } = render(<TripSummary />);

    expect(getByText('Resa avslutad!')).toBeTruthy();
    expect(getByText('2 min 5 sek')).toBeTruthy();
    expect(getByText('47.50 kr')).toBeTruthy();
  });

  it('allows closing the modal which clears the stored ride', () => {
    mockedUseRide.mockReturnValue(
      createContextValue({
        lastRide: baseRide,
        clearLastRide: mockClearLastRide,
      }),
    );

    const { getByText } = render(<TripSummary />);

    fireEvent.press(getByText('Betala och stäng'));

    expect(mockClearLastRide).toHaveBeenCalledTimes(1);
  });
});
