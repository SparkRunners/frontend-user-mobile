import { scooterApiClient } from '../../../api/httpClient';
import { rideApi } from '../api';
import type { Ride } from '../types';

jest.mock('../../../api/httpClient', () => {
  const post = jest.fn();
  const get = jest.fn();
  return {
    scooterApiClient: {
      post,
      get,
    },
  };
});

const mockPost = scooterApiClient.post as jest.Mock;
const mockGet = scooterApiClient.get as jest.Mock;

describe('rideApi', () => {
  const buildTrip = (overrides: Record<string, unknown> = {}) => ({
    _id: 'rent-001',
    scooterId: 'SCOOT-900',
    userId: 'user-123',
    startTime: '2025-01-01T12:00:00.000Z',
    endTime: null,
    status: 'active',
    cost: '10.00 kr',
    duration: '0 minutes',
    ...overrides,
  });

  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy?.mockRestore();
  });

  it('starts a ride via the rent start endpoint', async () => {
    mockPost.mockResolvedValueOnce({ data: { trip: buildTrip() } });

    const ride = await rideApi.startRide('SCOOT-900');

    expect(mockPost).toHaveBeenCalledWith('/rent/start/SCOOT-900');
    expect(ride).toMatchObject({
      id: 'rent-001',
      scooterId: 'SCOOT-900',
      status: 'active',
      cost: 10,
    });
  });

  it('stops a ride via the rent stop endpoint using scooter id', async () => {
    mockPost.mockResolvedValueOnce({
      data: { trip: buildTrip({
        id: 'rent-xyz',
        status: 'completed',
        endTime: '2025-01-01T12:30:00.000Z',
        duration: '30 minutes',
        cost: '52.00 kr',
      }) },
    });

    const ride = await rideApi.endRide('SCOOT-42');

    expect(mockPost).toHaveBeenCalledWith('/rent/stop/SCOOT-42');
    expect(ride).toMatchObject({
      id: 'rent-xyz',
      status: 'completed',
      durationSeconds: 1800,
      cost: 52,
      endTime: '2025-01-01T12:30:00.000Z',
    });
  });

  it('parses currency and duration strings', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        trip: buildTrip({
          id: 'rent-string',
          cost: '45,50 kr',
          duration: '5 minutes',
        }),
      },
    });

    const ride = await rideApi.endRide('SCOOT-900');

    expect(ride.cost).toBeCloseTo(45.5);
    expect(ride.durationSeconds).toBe(300);
  });

  it('falls back to local ride snapshot when stop response lacks trip data', async () => {
    mockPost.mockResolvedValueOnce({ data: { success: true } });

    const fallback: Ride = {
      id: 'rent-empty',
      scooterId: 'SCOOT-42',
      userId: 'user-fallback',
      startTime: '2025-02-01T10:00:00.000Z',
      endTime: '2025-02-01T10:10:00.000Z',
      status: 'completed',
      cost: 38,
      durationSeconds: 600,
    };

    const ride = await rideApi.endRide(fallback.scooterId, fallback);

    expect(mockPost).toHaveBeenCalledWith('/rent/stop/SCOOT-42');
    expect(ride).toMatchObject({
      id: 'rent-empty',
      scooterId: 'SCOOT-42',
      cost: 38,
      durationSeconds: 600,
      status: 'completed',
    });
  });

  it('returns copies of the ride history data', async () => {
    const trip = buildTrip({ id: 'rent-h1', cost: 46 });
    mockGet
      .mockResolvedValueOnce({ data: [trip] })
      .mockResolvedValueOnce({ data: [trip] });

    const firstHistory = await rideApi.getRideHistory();
    firstHistory[0].cost = 0;

    const secondHistory = await rideApi.getRideHistory();

    expect(mockGet).toHaveBeenCalledWith('/rent/history');
    expect(firstHistory[0]).not.toBe(secondHistory[0]);
    expect(secondHistory[0].cost).toBe(46);
  });

  it('extracts scooter id from nested payloads', async () => {
    const trip = buildTrip({
      id: 'rent-nested',
      scooterId: undefined,
      scooter_id: undefined,
      scooter: { id: 'NESTED-1' },
    });
    mockGet.mockResolvedValueOnce({ data: [trip] });

    const history = await rideApi.getRideHistory();

    expect(history[0].scooterId).toBe('NESTED-1');
  });

  it('supports paged history payloads containing metadata', async () => {
    const trip = buildTrip({ id: 'rent-meta' });
    mockGet.mockResolvedValueOnce({ data: { count: 1, trips: [trip] } });

    const history = await rideApi.getRideHistory();

    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('rent-meta');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns empty history when backend rejects auth', async () => {
    mockGet.mockRejectedValueOnce({ response: { status: 403 } });

    await expect(rideApi.getRideHistory()).resolves.toEqual([]);
  });

  it('warns and returns empty list when payload is unrecognized', async () => {
    mockGet.mockResolvedValueOnce({ data: { items: [] } });

    const history = await rideApi.getRideHistory();

    expect(history).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      '[rideApi] ride history payload not recognized, returning empty list',
    );
  });

  it('returns the active ride when available', async () => {
    mockGet.mockResolvedValueOnce({ data: [buildTrip()] });

    const ride = await rideApi.getCurrentRide();

    expect(mockGet).toHaveBeenCalledWith('/rent/history', {
      params: { status: 'active', limit: 1 },
    });
    expect(ride?.status).toBe('active');
  });

  it('falls back to null when backend has no active ride data', async () => {
    mockGet
      .mockResolvedValueOnce({ data: [buildTrip({ status: 'completed', endTime: '2025-01-01T12:05:00.000Z' })] })
      .mockRejectedValueOnce(new Error('not supported'));

    await expect(rideApi.getCurrentRide()).resolves.toBeNull();
    await expect(rideApi.getCurrentRide()).resolves.toBeNull();
  });

  it('normalizes zone rule payloads', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        rule: 'slow-speed',
        priority: 60,
        message: 'Max 15 km/h',
        speedLimitKmh: 15,
        nearestParking: {
          id: 'park-1',
          name: 'Centralen',
          distanceMeters: 120,
          latitude: 59.3,
          longitude: 18.06,
        },
      },
    });

    const result = await rideApi.checkZoneRules({ latitude: 59.3, longitude: 18.06 });

    expect(mockGet).toHaveBeenCalledWith('/zones/check', {
      params: {
        latitude: 59.3,
        longitude: 18.06,
      },
    });
    expect(result.rule).toMatchObject({ type: 'slow-speed', priority: 60, speedLimitKmh: 15 });
    expect(result.nearestParking).toMatchObject({
      id: 'park-1',
      name: 'Centralen',
      coordinate: { latitude: 59.3, longitude: 18.06 },
    });
  });

  it('picks highest priority rule from wrapped payloads', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: {
          rules: [
            { rule: 'slow-speed', priority: 40 },
            { rule: 'no-go', priority: 100, message: 'Förbjuden zon' },
          ],
          nearest_parking: {
            zoneId: 'p-42',
            distance: 300,
            coordinate: { lat: 59.32, lng: 18.07 },
          },
        },
      },
    });

    const result = await rideApi.checkZoneRules({ latitude: 59.3, longitude: 18.06, city: 'Stockholm' });

    expect(mockGet).toHaveBeenCalledWith('/zones/check', {
      params: {
        latitude: 59.3,
        longitude: 18.06,
        city: 'Stockholm',
      },
    });
    expect(result.rule).toMatchObject({ type: 'no-go', priority: 100 });
    expect(result.nearestParking?.id).toBe('p-42');
  });

  it('throws a friendly error when balance is insufficient on start', async () => {
    mockPost.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { error: 'Balance is insufficient', balance: 12, cost: 100 },
      },
    });

    await expect(rideApi.startRide('SCOOT-123')).rejects.toThrow(
      'Saldo räcker inte för att låsa upp. Fyll på ditt konto och försök igen.',
    );
  });

  it('throws a friendly error when balance is insufficient on stop', async () => {
    mockPost.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Balance is insufficient', balance: 12, cost: 200 },
      },
    });

    await expect(rideApi.endRide('SCOOT-123')).rejects.toThrow(
      'Saldo räcker inte för att avsluta resan. Fyll på ditt konto och försök igen.',
    );
  });
});
