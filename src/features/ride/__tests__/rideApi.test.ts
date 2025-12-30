import { rideApi } from '../api';

describe('rideApi', () => {
  const setTime = (value: string) => {
    jest.setSystemTime(new Date(value));
  };

  beforeEach(() => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    setTime('2025-01-01T12:00:00.000Z');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('starts a ride with default pricing', async () => {
    const promise = rideApi.startRide('SCOOT-900');

    jest.advanceTimersByTime(1000);
    const expectedTimestamp = Date.now();
    const ride = await promise;

    expect(ride).toMatchObject({
      scooterId: 'SCOOT-900',
      status: 'active',
      cost: 10,
      durationSeconds: 0,
    });
    expect(new Date(ride.startTime).getTime()).toBe(expectedTimestamp);
  });

  it('completes a ride and reports backend cost', async () => {
    const promise = rideApi.endRide('ride-abc');

    jest.advanceTimersByTime(1000);
    const completionTimestamp = Date.now();
    const ride = await promise;

    expect(ride).toMatchObject({
      id: 'ride-abc',
      status: 'completed',
      durationSeconds: 900,
      cost: 47.5,
    });
    expect(new Date(ride.endTime).getTime()).toBe(completionTimestamp);
    expect(new Date(ride.startTime).getTime()).toBe(completionTimestamp - ride.durationSeconds * 1000);
  });

  it('reports no current ride by default', async () => {
    const promise = rideApi.getCurrentRide();
    jest.advanceTimersByTime(500);

    await expect(promise).resolves.toBeNull();
  });

  it('returns copies of the ride history data', async () => {
    const firstPromise = rideApi.getRideHistory();
    jest.advanceTimersByTime(800);
    const firstHistory = await firstPromise;

    expect(firstHistory).toHaveLength(3);
    expect(firstHistory[0].id).toBe('ride_001');

    firstHistory[0].cost = 0;

    const secondPromise = rideApi.getRideHistory();
    jest.advanceTimersByTime(800);
    const secondHistory = await secondPromise;

    expect(secondHistory[0].id).toBe('ride_001');
    expect(secondHistory[0].cost).toBe(46);
    expect(secondHistory[0]).not.toBe(firstHistory[0]);
  });
});
