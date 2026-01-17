import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MapScreen } from '../MapScreen';
import type { ZoneCity } from '../zones/types';

// Mock Ride feature
const mockStartRide = jest.fn();
const mockRideState: any = {
  startRide: mockStartRide,
  endRide: jest.fn(),
  isRiding: false,
  currentRide: null,
  durationSeconds: 0,
  currentCost: 0,
  isLoading: false,
};

jest.mock('../../ride', () => ({
  useRide: () => mockRideState,
  RideDashboard: () => <mock-ride-dashboard testID="ride-dashboard" />,
  TripSummary: () => <mock-trip-summary testID="trip-summary" />,
}));

// Mock ScanScreen
jest.mock('../../scan', () => ({
  ScanScreen: ({ onScanSuccess, onClose, isRideLocked, onRideLockedAttempt }: any) => (
    <mock-scan-screen 
      testID="scan-screen" 
      onScanSuccess={() => {
        if (isRideLocked) {
          onRideLockedAttempt?.();
          return;
        }
        onScanSuccess('3124');
      }}
      onClose={onClose}
    />
  ),
}));

jest.mock('../../pricing/usePricing', () => ({
  usePricing: () => ({
    pricing: {
      city: 'Stockholm',
      currency: 'kr',
      baseFare: 10,
      perMinute: 2.5,
      note: 'Mock pricing',
      updatedAt: '2025-01-01T12:00:00.000Z',
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const MOCK_API_SCOOTERS = [
  {
    id: '3124',
    name: 'Scooter 3124',
    city: 'Stockholm',
    coordinates: { latitude: 59.3293, longitude: 18.0686 },
    battery: 87,
    status: 'Available',
    speed: 0,
  },
  {
    id: '3125',
    name: 'Scooter 3125',
    city: 'Stockholm',
    coordinates: { latitude: 59.3325, longitude: 18.0650 },
    battery: 45,
    status: 'Available',
    speed: 0,
  },
];

type MockScootersFeedState = {
  scooters: typeof MOCK_API_SCOOTERS;
  isLoading: boolean;
  error: string | null;
  refetch: jest.Mock;
};

const createFeedState = (overrides: Partial<MockScootersFeedState> = {}): MockScootersFeedState => ({
  scooters: MOCK_API_SCOOTERS,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
  ...overrides,
});

const mockUseScootersFeed = jest.fn<MockScootersFeedState, []>();

jest.mock('../../scooters/useScootersFeed', () => ({
  useScootersFeed: () => mockUseScootersFeed(),
}));

type MockPolygonZone = {
  id: string;
  type: 'parking' | 'slow-speed' | 'no-go' | 'charging';
  priority: number;
  coordinatesSets: Array<Array<{ latitude: number; longitude: number }>>;
};

type MockZonesState = {
  parkingZones: MockPolygonZone[];
  slowSpeedZones: MockPolygonZone[];
  noGoZones: MockPolygonZone[];
  chargingZones: MockPolygonZone[];
  isLoading: boolean;
  error: string | null;
  refetch: jest.Mock;
  city: ZoneCity;
};

const createZonesState = (overrides: Partial<MockZonesState> = {}): MockZonesState => ({
  parkingZones: [],
  slowSpeedZones: [],
  noGoZones: [],
  chargingZones: [],
  isLoading: false,
  error: null,
  refetch: jest.fn(),
  city: 'Stockholm',
  ...overrides,
});

const mockUseZones = jest.fn<MockZonesState, [ZoneCity | undefined]>();

jest.mock('../zones/useZones', () => ({
  useZones: (city?: ZoneCity) => mockUseZones(city),
}));

describe('MapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseScootersFeed.mockReturnValue(createFeedState());
    mockUseZones.mockReturnValue(createZonesState());
    mockStartRide.mockReset();
    mockRideState.isRiding = false;
    mockRideState.isLoading = false;
    mockRideState.startRide = mockStartRide;
    mockRideState.endRide = jest.fn();
  });

  it('renders the map with correct initial region', async () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('map-view')).toBeTruthy();
  });

  it('renders zone legend and zoom controls', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('zone-legend')).toBeTruthy();
    expect(getByTestId('zoom-in-button')).toBeTruthy();
    expect(getByTestId('zoom-out-button')).toBeTruthy();
  });

  it('renders markers for all scooters', async () => {
    const { getByTestId } = render(<MapScreen />);
    
    MOCK_API_SCOOTERS.forEach(scooter => {
      expect(getByTestId(`marker-${scooter.id}`)).toBeTruthy();
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
    expect(getByTestId('pricing-info')).toBeTruthy();
    expect(getByText('Startavgift')).toBeTruthy();
    expect(getByText('10 kr')).toBeTruthy();
    expect(getByText('2.50 kr/min')).toBeTruthy();
  });

  it('opens scanner and unlocks scooter', async () => {
    const { getByText, getByTestId } = render(<MapScreen />);
    
    // Find and press scan button
    const scanButton = getByText('Skanna');
    fireEvent.press(scanButton);
    
    // Check if ScanScreen is rendered
    const scanScreen = getByTestId('scan-screen');
    expect(scanScreen).toBeTruthy();
    
    // Trigger scan success (simulated by our mock)
    fireEvent(scanScreen, 'onScanSuccess');
    
    // Verify startRide was called
    await waitFor(() => {
      expect(mockStartRide).toHaveBeenCalledWith('3124');
    });
  });

  it('shows loading state before scooters arrive', () => {
    mockUseScootersFeed.mockReturnValue(
      createFeedState({ scooters: [], isLoading: true })
    );

    const { getByTestId, getByText } = render(<MapScreen />);

    expect(getByTestId('scooter-feed-loading')).toBeTruthy();
    expect(getByText('Hämtar...')).toBeTruthy();
    expect(getByTestId('scan-button').props.accessibilityState?.disabled).toBe(true);
  });

  it('renders error banner and retries the feed', () => {
    const refetch = jest.fn();
    mockUseScootersFeed.mockReturnValue(
      createFeedState({ error: 'Nätverksfel', refetch })
    );

    const { getByTestId, getByText } = render(<MapScreen />);

    expect(getByText('Nätverksfel')).toBeTruthy();
    fireEvent.press(getByTestId('scooter-feed-error'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('allows switching cities for zone filtering', () => {
    const { getByTestId, getByText } = render(<MapScreen />);
    const selector = getByTestId('city-selector');
    expect(selector).toBeTruthy();
    fireEvent.press(getByText('Göteborg'));
    expect(mockUseZones).toHaveBeenLastCalledWith('Göteborg');
  });

  it('shows zone error banner when loading fails', () => {
    const refetch = jest.fn();
    mockUseZones.mockReturnValue(
      createZonesState({ error: 'Zonfel', refetch })
    );

    const { getByTestId, getByText } = render(<MapScreen />);
    expect(getByText('Zonfel')).toBeTruthy();
    fireEvent.press(getByTestId('zone-feed-error'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders overlays for all zone types and charging markers', () => {
    mockUseZones.mockReturnValue(createZonesState({
      parkingZones: [
        {
          id: 'park-1',
          type: 'parking',
          priority: 1,
          coordinatesSets: [[
            { latitude: 59.3, longitude: 18.04 },
            { latitude: 59.31, longitude: 18.05 },
          ]],
        },
      ],
      slowSpeedZones: [
        {
          id: 'slow-1',
          type: 'slow-speed',
          priority: 2,
          coordinatesSets: [[
            { latitude: 59.4, longitude: 18.06 },
            { latitude: 59.41, longitude: 18.07 },
          ]],
        },
      ],
      noGoZones: [
        {
          id: 'no-1',
          type: 'no-go',
          priority: 3,
          coordinatesSets: [[
            { latitude: 59.5, longitude: 18.08 },
            { latitude: 59.51, longitude: 18.09 },
          ]],
        },
      ],
      chargingZones: [
        {
          id: 'station-1',
          type: 'charging',
          priority: 1,
          coordinatesSets: [[
            { latitude: 59.33, longitude: 18.06 },
            { latitude: 59.331, longitude: 18.061 },
            { latitude: 59.332, longitude: 18.062 },
          ]],
        },
      ],
    }));

    const { getByTestId } = render(<MapScreen />);

    expect(getByTestId('zone-parking-park-1-0')).toBeTruthy();
    expect(getByTestId('zone-slow-speed-slow-1-0')).toBeTruthy();
    expect(getByTestId('zone-no-go-no-1-0')).toBeTruthy();
    expect(getByTestId('zone-charging-station-1-0')).toBeTruthy();
  });

  it('prevents unlocking when a ride request is already in progress', async () => {
    mockRideState.isLoading = true;

    const { getByText, getByTestId } = render(<MapScreen />);
    fireEvent.press(getByText('Skanna'));
    const scanScreen = getByTestId('scan-screen');

    fireEvent(scanScreen, 'onScanSuccess');

    await waitFor(() => {
      expect(mockStartRide).not.toHaveBeenCalled();
    });
  });
});

