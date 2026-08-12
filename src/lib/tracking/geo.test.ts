import { describe, expect, it } from 'vitest';
import { bearingBetween, distanceMeters } from './geo';

const SUEZ = { latitude: 29.9668, longitude: 32.5498 };

describe('bearingBetween', () => {
  it('reads the cardinal directions', () => {
    expect(bearingBetween(SUEZ, { ...SUEZ, latitude: SUEZ.latitude + 0.01 })).toBeCloseTo(0, 0);
    expect(bearingBetween(SUEZ, { ...SUEZ, longitude: SUEZ.longitude + 0.01 })).toBeCloseTo(90, 0);
    expect(bearingBetween(SUEZ, { ...SUEZ, latitude: SUEZ.latitude - 0.01 })).toBeCloseTo(180, 0);
    expect(bearingBetween(SUEZ, { ...SUEZ, longitude: SUEZ.longitude - 0.01 })).toBeCloseTo(270, 0);
  });

  it('always returns a value inside 0–360', () => {
    const bearing = bearingBetween(SUEZ, {
      latitude: SUEZ.latitude - 0.02,
      longitude: SUEZ.longitude - 0.02,
    });

    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });
});

describe('distanceMeters', () => {
  it('is zero for the same point', () => {
    expect(distanceMeters(SUEZ, SUEZ)).toBe(0);
  });

  it('measures a short city hop closely enough to filter GPS jitter', () => {
    // 0.001° of latitude is ~111 m.
    expect(distanceMeters(SUEZ, { ...SUEZ, latitude: SUEZ.latitude + 0.001 })).toBeCloseTo(111, 0);
  });

  it('puts a jitter-sized move below the 8 m bearing threshold', () => {
    expect(distanceMeters(SUEZ, { ...SUEZ, latitude: SUEZ.latitude + 0.00003 })).toBeLessThan(8);
  });
});
