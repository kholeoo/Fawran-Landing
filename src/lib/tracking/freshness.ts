/**
 * How old is the courier's last known position, and how honest should the page
 * be about it.
 *
 * Pure so the thresholds can be tested directly. The page must never claim live
 * tracking it cannot back up, so this is the single place that decides.
 */

/**
 * Below this, the position is current enough to call live. Fixes arrive about
 * every 3s, so a minute of silence means the courier's phone has lost signal —
 * normal in a tunnel or a basement, and the marker greys rather than the page
 * looking broken.
 */
export const LIVE_THRESHOLD_MS = 60_000;

/** Above this, the receiver is warned the position may be out of date. */
export const STALE_WARNING_THRESHOLD_MS = 5 * 60_000;

export type FreshnessLevel = 'live' | 'stale' | 'very_stale' | 'unknown';

export type Freshness = {
  level: FreshnessLevel;
  /** Whole units elapsed, for the "منذ 5 ثواني" copy. Null when unknown. */
  count: number | null;
  unit: 'second' | 'minute' | 'hour' | null;
};

const UNKNOWN: Freshness = { level: 'unknown', count: null, unit: null };

/**
 * @param lastUpdatedAt ISO timestamp from the backend, or null if we have none.
 * @param now epoch millis — passed in rather than read, so tests are deterministic.
 * @param isConnected whether the socket is currently up. A dropped socket is
 *        never "live", however recent the last fix was.
 */
export function getFreshness(
  lastUpdatedAt: string | null,
  now: number,
  isConnected: boolean,
): Freshness {
  if (!lastUpdatedAt) return UNKNOWN;

  const timestamp = Date.parse(lastUpdatedAt);
  if (Number.isNaN(timestamp)) return UNKNOWN;

  // Clock skew between the courier's device, the server, and this browser can
  // put the timestamp slightly in the future. Treat that as "just now" rather
  // than rendering a negative age.
  const elapsed = Math.max(0, now - timestamp);

  const level: FreshnessLevel =
    elapsed >= STALE_WARNING_THRESHOLD_MS
      ? 'very_stale'
      : elapsed >= LIVE_THRESHOLD_MS || !isConnected
        ? 'stale'
        : 'live';

  if (elapsed < 60_000) {
    return { level, count: Math.floor(elapsed / 1_000), unit: 'second' };
  }

  if (elapsed < 3_600_000) {
    return { level, count: Math.floor(elapsed / 60_000), unit: 'minute' };
  }

  return { level, count: Math.floor(elapsed / 3_600_000), unit: 'hour' };
}
