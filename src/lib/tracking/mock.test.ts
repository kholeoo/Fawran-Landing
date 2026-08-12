import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMockEnabled, startMockLocationFeed } from './mock';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('development mock gate', () => {
  it('stays off unless explicitly opted into', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_TRACKING_MOCK', '');
    expect(isMockEnabled()).toBe(false);
  });

  it('turns on in development when the flag is set', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_TRACKING_MOCK', '1');
    expect(isMockEnabled()).toBe(true);
  });

  it('cannot be turned on in production, even with the flag set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_TRACKING_MOCK', '1');
    expect(isMockEnabled()).toBe(false);
  });
});

describe('startMockLocationFeed', () => {
  it('walks the scripted route and stops cleanly', () => {
    vi.useFakeTimers();
    const onLocation = vi.fn();

    const stop = startMockLocationFeed(onLocation, 1_000);
    vi.advanceTimersByTime(3_000);

    expect(onLocation).toHaveBeenCalledTimes(3);
    // The same three keys the real `tracking:location` push carries.
    expect(onLocation.mock.calls[0][0]).toEqual({
      latitude: expect.any(Number),
      longitude: expect.any(Number),
      updatedAt: expect.any(String),
    });

    stop();
    vi.advanceTimersByTime(10_000);
    expect(onLocation).toHaveBeenCalledTimes(3);
  });
});
