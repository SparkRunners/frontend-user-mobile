import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MapScreen } from '../MapScreen';
import { fetchScooters } from '../../scooters/api';

// Mock the API
jest.mock('../../scooters/api', () => ({
  fetchScooters: jest.fn(),
}));

const MOCK_API_SCOOTERS = [
  {
    id: 3124,
    name: 'Scooter 3124',
    city: 'Stockholm',
    coordinates: { latitude: 59.3293, longitude: 18.0686 },
    battery: 87,
    status: 'Available',
    speed: 0,
  },
  {
    id: 3125,
    name: 'Scooter 3125',
    city: 'Stockholm',
    coordinates: { latitude: 59.3325, longitude: 18.0650 },
    battery: 45,
    status: 'Available',
    speed: 0,
  },
];

describe('MapScreen', () => {
  beforeEach(() => {
    (fetchScooters as jest.Mock).mockResolvedValue(MOCK_API_SCOOTERS);
  });

  it('renders the map with correct initial region', async () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('map-view')).toBeTruthy();
    await waitFor(() => expect(fetchScooters).toHaveBeenCalled());
  });

  it('renders markers for all scooters', async () => {
    const { getByTestId } = render(<MapScreen />);
    
    await waitFor(() => {
      MOCK_API_SCOOTERS.forEach(scooter => {
        expect(getByTestId(`marker-${scooter.id}`)).toBeTruthy();
      });
    });
  });

  it('shows scooter details when a marker is pressed', async () => {
    const { getByTestId, getByText, queryByText } = render(<MapScreen />);
    const scooter = MOCK_API_SCOOTERS[0];

    await waitFor(() => expect(getByTestId(`marker-${scooter.id}`)).toBeTruthy());

    // Initially no details shown
    expect(queryByText(`Scooter ID: ${scooter.id}`)).toBeNull();

    // Press marker
    fireEvent.press(getByTestId(`marker-${scooter.id}`));

    // Details should be visible
    expect(getByText(`Scooter ID: ${scooter.id}`)).toBeTruthy();
    expect(getByText(`${scooter.battery}%`)).toBeTruthy();
    expect(getByText('Starta resa')).toBeTruthy();
  });
});

