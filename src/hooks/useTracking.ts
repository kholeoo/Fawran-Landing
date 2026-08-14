'use client';

/**
 * Orchestrates one tracking session: one REST call on load, then a live
 * subscription. Components read the returned state and render it — they never
 * talk to the API or the socket themselves.
 *
 * The REST endpoint is rate limited (30/min per IP), so it is called exactly
 * once per mount plus once per explicit retry. Reconnects refresh state from
 * the subscribe ack instead, which is both cheaper and more current.
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { trackingApi } from '@/lib/tracking/api';
import {
  trackingSocket,
  type TrackingConnectionState,
  type TrackingSubscribeError,
} from '@/lib/tracking/socket';
import {
  isValidTrackingToken,
  type CourierLocation,
  type TrackingState,
  type TrackingStatus,
} from '@/lib/tracking/contract';

export type TrackingPhase =
  /** Initial fetch in flight. */
  | 'loading'
  /** Token failed its format check — never sent to the backend. */
  | 'invalid'
  /** Backend says the token does not resolve. Same answer for every reason. */
  | 'not_found'
  /** Backend unreachable or broken. Retryable — distinct from `not_found`. */
  | 'error'
  /** We have state to render. */
  | 'ready';

type State = {
  phase: TrackingPhase;
  tracking: TrackingState | null;
  connection: TrackingConnectionState;
  /** Bumped by retry() to re-run the fetch effect. */
  attempt: number;
};

type Action =
  | { type: 'fetch_start' }
  | { type: 'fetch_success'; state: TrackingState }
  | { type: 'fetch_not_found' }
  | { type: 'fetch_error' }
  | { type: 'invalid_token' }
  | { type: 'state'; state: TrackingState }
  | { type: 'location'; location: CourierLocation }
  | { type: 'connection'; connection: TrackingConnectionState }
  | { type: 'retry' };

const INITIAL: State = {
  phase: 'loading',
  tracking: null,
  connection: 'connecting',
  attempt: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'fetch_start':
      return { ...state, phase: 'loading' };

    case 'fetch_success':
      return { ...state, phase: 'ready', tracking: action.state };

    case 'fetch_not_found':
      return { ...state, phase: 'not_found', tracking: null };

    case 'fetch_error':
      return { ...state, phase: 'error' };

    case 'invalid_token':
      return { ...state, phase: 'invalid', tracking: null };

    case 'state': {
      // Whole-state replacement: `tracking:status` and the subscribe ack both
      // carry the complete public object, including the backend's decision to
      // drop `location` on a terminal state. Merging fields would let a stale
      // courier pin survive a delivery that is over.
      if (state.tracking && sameState(state.tracking, action.state)) return state;
      return { ...state, phase: 'ready', tracking: action.state };
    }

    case 'location': {
      if (!state.tracking) return state;
      // A finished delivery has no live position. Late fixes are dropped rather
      // than drawn — the backend stops sending them, and this is the backstop.
      if (state.tracking.isFinal || !state.tracking.isTrackingActive) return state;

      return { ...state, tracking: { ...state.tracking, location: action.location } };
    }

    case 'connection':
      return state.connection === action.connection
        ? state
        : { ...state, connection: action.connection };

    case 'retry':
      return { ...state, phase: 'loading', attempt: state.attempt + 1 };

    default:
      return state;
  }
}

/**
 * Whether a fresh full state is worth re-rendering for. The subscribe ack
 * repeats on every reconnect, and an identical object would otherwise replace
 * `destination` with an equal-but-new reference and rebuild the map's markers.
 */
function sameState(a: TrackingState, b: TrackingState): boolean {
  return (
    a.status === b.status &&
    a.isTrackingActive === b.isTrackingActive &&
    a.isFinal === b.isFinal &&
    a.location?.latitude === b.location?.latitude &&
    a.location?.longitude === b.location?.longitude &&
    a.location?.updatedAt === b.location?.updatedAt &&
    a.destination?.latitude === b.destination?.latitude &&
    a.destination?.longitude === b.destination?.longitude &&
    a.fees === b.fees &&
    a.courier?.name === b.courier?.name &&
    a.courier?.mobile === b.courier?.mobile
  );
}

export type TrackingSession = {
  phase: TrackingPhase;
  tracking: TrackingState | null;
  connection: TrackingConnectionState;
  /** True only while the subscription is accepted and the delivery is running. */
  isLive: boolean;
  retry: () => void;
};

export type TrackingCallbacks = {
  /** Fired once, when the subscription is first accepted. */
  onLiveStarted?: () => void;
  /** Fired once, when the socket gives up. */
  onConnectionFailed?: () => void;
  /** Fired once, when the delivery reaches a final state. */
  onCompleted?: (status: TrackingStatus) => void;
};

export function useTracking(token: string, callbacks: TrackingCallbacks = {}): TrackingSession {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Callbacks live in a ref so a caller passing inline functions cannot restart
  // the subscription on every render.
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const firedLiveStarted = useRef(false);
  const firedConnectionFailed = useRef(false);
  const firedCompleted = useRef(false);

  // ── Initial state ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isValidTrackingToken(token)) {
      dispatch({ type: 'invalid_token' });
      return;
    }

    const controller = new AbortController();
    let active = true;

    dispatch({ type: 'fetch_start' });

    void trackingApi.getTracking(token, controller.signal).then((result) => {
      if (!active) return;

      if (result.ok) {
        dispatch({ type: 'fetch_success', state: result.state });
      } else if (result.error.kind === 'not_found') {
        dispatch({ type: 'fetch_not_found' });
      } else {
        dispatch({ type: 'fetch_error' });
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, state.attempt]);

  // ── Live updates ─────────────────────────────────────────────────────────
  //
  // Depends only on what decides whether a socket should exist at all, never on
  // the tracking payload — otherwise every fix would tear the connection down
  // and open a new one.
  const isFinal = state.tracking?.isFinal ?? false;
  const shouldSubscribe = state.phase === 'ready' && !isFinal;

  useEffect(() => {
    if (!shouldSubscribe) return;

    const unsubscribe = trackingSocket.subscribe(token, {
      onState: (next) => dispatch({ type: 'state', state: next }),
      onLocation: (location) => dispatch({ type: 'location', location }),
      onSubscribeError: (error: TrackingSubscribeError) => {
        // The backend gives the same answer for "never existed", "malformed"
        // and "no longer resolves", and so does the page.
        if (error === 'TRACKING_NOT_FOUND' || error === 'INVALID_PAYLOAD') {
          dispatch({ type: 'fetch_not_found' });
        }
      },
      onConnectionChange: (connection) => {
        dispatch({ type: 'connection', connection });

        if (connection === 'connected' && !firedLiveStarted.current) {
          firedLiveStarted.current = true;
          callbacksRef.current.onLiveStarted?.();
        }

        if (connection === 'failed' && !firedConnectionFailed.current) {
          firedConnectionFailed.current = true;
          callbacksRef.current.onConnectionFailed?.();
        }
      },
    });

    return unsubscribe;
  }, [shouldSubscribe, token]);

  // ── Completion ───────────────────────────────────────────────────────────
  const status = state.tracking?.status;
  useEffect(() => {
    if (!isFinal || !status || firedCompleted.current) return;
    firedCompleted.current = true;
    callbacksRef.current.onCompleted?.(status);
  }, [isFinal, status]);

  const retry = useCallback(() => dispatch({ type: 'retry' }), []);

  return {
    phase: state.phase,
    tracking: state.tracking,
    connection: state.connection,
    isLive:
      shouldSubscribe &&
      state.connection === 'connected' &&
      (state.tracking?.isTrackingActive ?? false),
    retry,
  };
}
