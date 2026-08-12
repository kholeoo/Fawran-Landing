/**
 * Public tracking REST client.
 *
 * The only network call this page makes on its own behalf. No auth, no cookies,
 * no private order endpoints — the tracking token is the whole identity.
 */

import { apiBaseUrl } from '@/lib/api';
import { normalizeTrackingState, type TrackingState } from './contract';
import { isMockEnabled, getMockTrackingState } from './mock';

/**
 * Why a fetch failed, in terms the UI can act on. Deliberately coarse: the
 * receiver is shown one of two things — "this link is dead" or "we could not
 * reach us, try again" — and nothing from the backend's own error body.
 */
export type TrackingFetchError =
  /**
   * 404 — the token does not resolve. The backend answers identically for an
   * unknown token, a malformed one, and an internal id pasted in as one, and
   * the UI keeps that answer just as uninformative.
   */
  | { kind: 'not_found' }
  /** Anything else: 429, 5xx, offline, CORS, malformed body. Retryable. */
  | { kind: 'unavailable' };

export type TrackingFetchResult =
  | { ok: true; state: TrackingState }
  | { ok: false; error: TrackingFetchError };

const REQUEST_TIMEOUT_MS = 12_000;

export const trackingApi = {
  /**
   * Fetch the initial state for a token. Never throws — every failure mode is
   * folded into the result so callers cannot accidentally leak an exception
   * message into the UI.
   */
  async getTracking(token: string, signal?: AbortSignal): Promise<TrackingFetchResult> {
    if (isMockEnabled()) {
      return { ok: true, state: getMockTrackingState() };
    }

    // Time out slowly-hanging requests ourselves: a spinner that never resolves
    // is worse than a retry button, and this page opens on mobile networks.
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
    const composed = signal
      ? AbortSignal.any([signal, timeout.signal])
      : timeout.signal;

    try {
      const res = await fetch(
        `${apiBaseUrl}/public/tracking/${encodeURIComponent(token)}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store',
          // The token is in the path, so it must not ride along in a Referer
          // header on this or any request the page makes.
          referrerPolicy: 'no-referrer',
          credentials: 'omit',
          signal: composed,
        },
      );

      if (res.status === 404) {
        return { ok: false, error: { kind: 'not_found' } };
      }

      if (!res.ok) {
        return { ok: false, error: { kind: 'unavailable' } };
      }

      const state = normalizeTrackingState(await res.json());
      if (!state) {
        return { ok: false, error: { kind: 'unavailable' } };
      }

      return { ok: true, state };
    } catch {
      // Offline, CORS, abort, invalid JSON — all indistinguishable to the
      // receiver and all retryable. The underlying reason never reaches the UI.
      return { ok: false, error: { kind: 'unavailable' } };
    } finally {
      clearTimeout(timer);
    }
  },
};
