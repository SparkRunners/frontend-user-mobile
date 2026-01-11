import { scooterApiClient } from '../../../api/httpClient';
import { rideApi } from '../api';

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
    id: 'rent-001',
    scooterId: 'SCOOT-900',
    userId: 'user-123',
    startTime: '2025-01-01T12:00:00.000Z',
    status: 'active',
    cost: 10,
    durationSeconds: 0,
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
    mockPost.mockResolvedValueOnce({ data: buildTrip() });

    const ride = await rideApi.startRide('SCOOT-900');

    expect(mockPost).toHaveBeenCalledWith('/api/v1/rent/start/SCOOT-900');
    expect(ride).toMatchObject({
      id: 'rent-001',
      scooterId: 'SCOOT-900',
      status: 'active',
      cost: 10,
    });
  });

  it('stops a ride via the rent stop endpoint', async () => {
    mockPost.mockResolvedValueOnce({
      data: buildTrip({
        id: 'rent-xyz',
        status: 'completed',
        endTime: '2025-01-01T12:30:00.000Z',
        durationSeconds: 1800,
        cost: 52,
      }),
    });

    const ride = await rideApi.endRide('rent-xyz');

    expect(mockPost).toHaveBeenCalledWith('/api/v1/rent/stop/rent-xyz');
    expect(ride).toMatchObject({
      id: 'rent-xyz',
      status: 'completed',
      durationSeconds: 1800,
      cost: 52,
      endTime: '2025-01-01T12:30:00.000Z',
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

    expect(mockGet).toHaveBeenCalledWith('/api/v1/rent/history');
    expect(firstHistory[0]).not.toBe(secondHistory[0]);
    expect(secondHistory[0].cost).toBe(46);
  });

  it('returns the active ride when available', async () => {
    mockGet.mockResolvedValueOnce({ data: [buildTrip()] });

    const ride = await rideApi.getCurrentRide();

    expect(mockGet).toHaveBeenCalledWith('/api/v1/rent/history', {
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
});
