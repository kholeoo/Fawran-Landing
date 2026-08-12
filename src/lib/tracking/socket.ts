/**
 * Public tracking realtime subscription.
 *
 * Wraps socket.io so no UI component touches a raw socket. The `/public-tracking`
 * namespace accepts anonymous connections and is isolated from the authenticated
 * gateway — there is no JWT on this page and never should be.
 *
 * socket.io-client is imported lazily: it is bytes the receiver does not need
 * before first paint, and this page opens on mobile networks.
 */

import { realtimeOrigin } from '@/lib/api';
import {
  normalizeLocationEvent,
  normalizeTrackingState,
  type CourierLocation,
  type TrackingState,
} from './contract';
import { isMockEnabled, startMockLocationFeed } from './mock';

const NAMESPACE = '/public-tracking';

export type TrackingConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'failed';

/** Subscribe rejection reasons defined by the backend contract. */
export type TrackingSubscribeError =
  | 'INVALID_PAYLOAD'
  | 'TRACKING_NOT_FOUND'
  | 'TOO_MANY_SUBSCRIPTIONS'
  | 'UNKNOWN';

export type TrackingSubscriptionHandlers = {
  /**
   * Full state from the subscribe ack or a `tracking:status` push. The ack is
   * more current than a REST refetch, so it is treated as the fresh truth.
   */
  onState: (state: TrackingState) => void;
  onLocation: (location: CourierLocation) => void;
  onConnectionChange: (state: TrackingConnectionState) => void;
  /** The token does not resolve. Terminal — the page shows the invalid state. */
  onSubscribeError: (error: TrackingSubscribeError) => void;
};

/** Teardown. Idempotent — safe to call from an effect cleanup more than once. */
export type TrackingSubscription = () => void;

const RECONNECTION_ATTEMPTS = 8;
const RECONNECTION_DELAY_MS = 2_000;
const RECONNECTION_DELAY_MAX_MS = 15_000;
const SUBSCRIBE_ACK_TIMEOUT_MS = 10_000;

type SubscribeAck = {
  ok?: boolean;
  error?: string;
  tracking?: unknown;
};

function parseSubscribeError(raw: unknown): TrackingSubscribeError {
  return raw === 'INVALID_PAYLOAD' ||
    raw === 'TRACKING_NOT_FOUND' ||
    raw === 'TOO_MANY_SUBSCRIPTIONS'
    ? raw
    : 'UNKNOWN';
}

export const trackingSocket = {
  /**
   * Subscribe to live updates for one tracking token.
   *
   * socket.io rooms do not survive a reconnect, so `tracking:subscribe` is
   * re-emitted on every `connect`, not just the first. Reconnection backoff is
   * socket.io's own; this only translates its lifecycle into the four states
   * the UI needs.
   */
  subscribe(token: string, handlers: TrackingSubscriptionHandlers): TrackingSubscription {
    if (isMockEnabled()) {
      handlers.onConnectionChange('connected');
      return startMockLocationFeed(handlers.onLocation);
    }

    let disposed = false;
    let teardown: (() => void) | null = null;

    handlers.onConnectionChange('connecting');

    void import('socket.io-client')
      .then(({ io }) => {
        // The effect may have been torn down while the chunk was in flight.
        if (disposed) return;

        const socket = io(`${realtimeOrigin}${NAMESPACE}`, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: RECONNECTION_ATTEMPTS,
          reconnectionDelay: RECONNECTION_DELAY_MS,
          reconnectionDelayMax: RECONNECTION_DELAY_MAX_MS,
          // A public page must never share a multiplexed connection with
          // anything that might be authenticated.
          forceNew: true,
        });

        const handleLocation = (payload: unknown) => {
          const location = normalizeLocationEvent(payload);
          if (location) handlers.onLocation(location);
        };

        const handleStatus = (payload: unknown) => {
          const state = normalizeTrackingState(payload);
          if (state) handlers.onState(state);
        };

        const handleConnect = () => {
          // Not "connected" until the subscription is actually accepted: a live
          // socket that has joined no room is not live tracking.
          void socket
            .timeout(SUBSCRIBE_ACK_TIMEOUT_MS)
            .emitWithAck('tracking:subscribe', { trackingToken: token })
            .then((ack: SubscribeAck | undefined) => {
              if (disposed) return;

              if (!ack?.ok) {
                const error = parseSubscribeError(ack?.error);
                handlers.onConnectionChange('failed');
                handlers.onSubscribeError(error);
                return;
              }

              handlers.onConnectionChange('connected');

              // The ack carries current state — cheaper and fresher than a
              // REST refetch, and it closes the gap opened by a reconnect.
              const state = normalizeTrackingState(ack.tracking);
              if (state) handlers.onState(state);
            })
            .catch(() => {
              // Ack timed out. The transport may still be fine, so this is a
              // retryable condition rather than a dead link.
              if (!disposed) handlers.onConnectionChange('reconnecting');
            });
        };

        socket.on('connect', handleConnect);

        socket.on('disconnect', (reason) => {
          // An explicit server- or client-side disconnect is not retried by
          // socket.io, so it is terminal rather than a blip.
          handlers.onConnectionChange(
            reason === 'io server disconnect' || reason === 'io client disconnect'
              ? 'failed'
              : 'reconnecting',
          );
        });

        socket.io.on('reconnect_attempt', () => handlers.onConnectionChange('reconnecting'));
        socket.io.on('reconnect_failed', () => handlers.onConnectionChange('failed'));
        socket.on('connect_error', () => handlers.onConnectionChange('reconnecting'));

        socket.on('tracking:location', handleLocation);
        socket.on('tracking:status', handleStatus);

        teardown = () => {
          // Best-effort courtesy so the server can drop the room early; the
          // disconnect below is what actually guarantees it.
          if (socket.connected) {
            socket.emit('tracking:unsubscribe', { trackingToken: token });
          }
          socket.removeAllListeners();
          socket.io.removeAllListeners();
          socket.disconnect();
        };
      })
      .catch(() => {
        if (!disposed) handlers.onConnectionChange('failed');
      });

    return () => {
      disposed = true;
      teardown?.();
      teardown = null;
    };
  },
};
