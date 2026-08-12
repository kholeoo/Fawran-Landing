import { describe, expect, it } from 'vitest';
import { getFreshness } from './freshness';

const NOW = Date.parse('2026-08-12T12:00:00.000Z');
const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe('getFreshness', () => {
  it('calls a recent fix live while the socket is up', () => {
    expect(getFreshness(ago(5_000), NOW, true)).toEqual({
      level: 'live',
      count: 5,
      unit: 'second',
    });
  });

  it('refuses to call anything live while the socket is down', () => {
    expect(getFreshness(ago(5_000), NOW, false).level).toBe('stale');
  });

  it('drops out of live after a minute of silence', () => {
    expect(getFreshness(ago(59_000), NOW, true).level).toBe('live');
    expect(getFreshness(ago(60_000), NOW, true).level).toBe('stale');
  });

  it('warns explicitly once the fix is five minutes old', () => {
    expect(getFreshness(ago(4 * 60_000), NOW, true).level).toBe('stale');
    expect(getFreshness(ago(5 * 60_000), NOW, true).level).toBe('very_stale');
  });

  it('picks the unit the receiver would use', () => {
    expect(getFreshness(ago(45_000), NOW, true)).toMatchObject({ count: 45, unit: 'second' });
    expect(getFreshness(ago(3 * 60_000), NOW, true)).toMatchObject({ count: 3, unit: 'minute' });
    expect(getFreshness(ago(2 * 3_600_000), NOW, true)).toMatchObject({ count: 2, unit: 'hour' });
  });

  it('treats clock skew from the courier device as "just now"', () => {
    expect(getFreshness(ago(-30_000), NOW, true)).toEqual({
      level: 'live',
      count: 0,
      unit: 'second',
    });
  });

  it('reports unknown when there is no usable timestamp', () => {
    const unknown = { level: 'unknown', count: null, unit: null };
    expect(getFreshness(null, NOW, true)).toEqual(unknown);
    expect(getFreshness('not-a-date', NOW, true)).toEqual(unknown);
  });
});
