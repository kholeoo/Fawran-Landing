import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackingSubscriptionHandlers } from '@/lib/tracking/socket';
import type { TrackingFetchResult } from '@/lib/tracking/api';
import { TRACKING_STATUS, type TrackingState } from '@/lib/tracking/contract';

const getTracking = vi.fn<(token: string, signal?: AbortSignal) => Promise<TrackingFetchResult>>();
const subscribe = vi.fn<(token: string, handlers: TrackingSubscriptionHandlers) => () => void>();

vi.mock('@/lib/tracking/api', () => ({
  trackingApi: { getTracking: (...args: Parameters<typeof getTracking>) => getTracking(...args) },
}));

vi.mock('@/lib/tracking/socket', () => ({
  trackingSocket: { subscribe: (...args: Parameters<typeof subscribe>) => subscribe(...args) },
}));

const { useTracking } = await import('./useTracking');

const TOKEN = '8KX29M4PZQ7RTV';

const IN_TRANSIT: TrackingState = {
  status: TRACKING_STATUS.IN_TRANSIT,
  isTrackingActive: true,
  isFinal: false,
  location: { latitude: 29.9668, longitude: 32.5498, updatedAt: '2026-08-12T10:00:00.000Z' },
  destination: { latitude: 29.9812, longitude: 32.5384 },
};

const DELIVERED: TrackingState = {
  status: TRACKING_STATUS.DELIVERED,
  isTrackingActive: false,
  isFinal: true,
  location: null,
  destination: { latitude: 29.9812, longitude: 32.5384 },
};

/** Latest handlers the hook registered with the socket. */
function handlers(): TrackingSubscriptionHandlers {
  return subscribe.mock.calls[subscribe.mock.calls.length - 1][1];
}

beforeEach(() => {
  getTracking.mockReset();
  subscribe.mockReset();
  getTracking.mockResolvedValue({ ok: true, state: IN_TRANSIT });
  subscribe.mockReturnValue(() => {});
});

describe('useTracking — initial state', () => {
  it('loads, then exposes the backend state', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));

    expect(result.current.phase).toBe('loading');
    await waitFor(() => expect(result.current.phase).toBe('ready'));

    expect(result.current.tracking).toEqual(IN_TRANSIT);
    expect(getTracking).toHaveBeenCalledWith(TOKEN, expect.any(AbortSignal));
  });

  it('rejects a malformed token without ever calling the rate-limited endpoint', async () => {
    const { result } = renderHook(() => useTracking('bad'));

    await waitFor(() => expect(result.current.phase).toBe('invalid'));
    expect(getTracking).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('reports a token that does not resolve as not_found', async () => {
    getTracking.mockResolvedValue({ ok: false, error: { kind: 'not_found' } });
    const { result } = renderHook(() => useTracking(TOKEN));

    await waitFor(() => expect(result.current.phase).toBe('not_found'));
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('separates an unreachable backend from a dead link, and retries', async () => {
    getTracking.mockResolvedValue({ ok: false, error: { kind: 'unavailable' } });
    const { result } = renderHook(() => useTracking(TOKEN));

    await waitFor(() => expect(result.current.phase).toBe('error'));

    getTracking.mockResolvedValue({ ok: true, state: IN_TRANSIT });
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.phase).toBe('ready'));
    expect(getTracking).toHaveBeenCalledTimes(2);
  });

  it('calls the rate-limited endpoint exactly once per mount', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    act(() => handlers().onLocation({ latitude: 29.97, longitude: 32.54, updatedAt: null }));
    act(() => handlers().onState(IN_TRANSIT));
    act(() => handlers().onConnectionChange('reconnecting'));
    act(() => handlers().onConnectionChange('connected'));

    expect(getTracking).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe('ready');
  });
});

describe('useTracking — live updates', () => {
  it('subscribes for a delivery that is not yet final', async () => {
    renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1));
    expect(subscribe.mock.calls[0][0]).toBe(TOKEN);
  });

  it('subscribes while still SEARCHING, so the assignment can arrive', async () => {
    getTracking.mockResolvedValue({
      ok: true,
      state: {
        status: TRACKING_STATUS.SEARCHING,
        isTrackingActive: false,
        isFinal: false,
        location: null,
        destination: null,
      },
    });

    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1));

    // Connected, but not "live": there is no courier streaming yet.
    act(() => handlers().onConnectionChange('connected'));
    expect(result.current.isLive).toBe(false);
  });

  it('moves the courier without a refetch', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    act(() =>
      handlers().onLocation({
        latitude: 29.9714,
        longitude: 32.5463,
        updatedAt: '2026-08-12T10:00:30.000Z',
      }),
    );

    expect(result.current.tracking?.location).toEqual({
      latitude: 29.9714,
      longitude: 32.5463,
      updatedAt: '2026-08-12T10:00:30.000Z',
    });
    expect(getTracking).toHaveBeenCalledTimes(1);
  });

  it('adopts a full state pushed over the socket', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    act(() => handlers().onState(DELIVERED));

    expect(result.current.tracking).toEqual(DELIVERED);
  });

  it('ignores a repeated ack state, so the map keeps its marker references', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    const before = result.current.tracking;
    // A reconnect replays the same state as a structurally equal new object.
    act(() => handlers().onState(structuredClone(IN_TRANSIT)));

    expect(result.current.tracking).toBe(before);
  });

  it('is only live while connected and a courier is actually streaming', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    act(() => handlers().onConnectionChange('connected'));
    expect(result.current.isLive).toBe(true);

    act(() => handlers().onConnectionChange('reconnecting'));
    expect(result.current.isLive).toBe(false);
    expect(result.current.connection).toBe('reconnecting');
  });

  it('keeps the last known position through a network drop', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    act(() =>
      handlers().onLocation({ latitude: 29.9714, longitude: 32.5463, updatedAt: null }),
    );
    act(() => handlers().onConnectionChange('failed'));

    expect(result.current.tracking?.location).toMatchObject({
      latitude: 29.9714,
      longitude: 32.5463,
    });
  });

  it('does not resubscribe on every location update', async () => {
    renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1));

    act(() => handlers().onLocation({ latitude: 29.9714, longitude: 32.5463, updatedAt: null }));
    act(() => handlers().onLocation({ latitude: 29.9736, longitude: 32.5447, updatedAt: null }));

    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it('shows the invalid state when the socket rejects the token', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    act(() => handlers().onSubscribeError('TRACKING_NOT_FOUND'));

    expect(result.current.phase).toBe('not_found');
  });

  it('does not kill the page over a subscription cap', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    act(() => handlers().onSubscribeError('TOO_MANY_SUBSCRIPTIONS'));

    // The initial state is still valid and still worth showing.
    expect(result.current.phase).toBe('ready');
  });
});

describe('useTracking — final states', () => {
  it('tears the socket down when the delivery finishes over the wire', async () => {
    const unsubscribe = vi.fn();
    subscribe.mockReturnValue(unsubscribe);

    const onCompleted = vi.fn();
    const { result } = renderHook(() => useTracking(TOKEN, { onCompleted }));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    act(() => handlers().onState(DELIVERED));

    await waitFor(() => expect(unsubscribe).toHaveBeenCalled());
    expect(result.current.tracking?.status).toBe(TRACKING_STATUS.DELIVERED);
    expect(result.current.tracking?.location).toBeNull();
    expect(result.current.isLive).toBe(false);
    expect(onCompleted).toHaveBeenCalledWith(TRACKING_STATUS.DELIVERED);
  });

  it('never subscribes at all for a delivery that is already over', async () => {
    getTracking.mockResolvedValue({
      ok: true,
      state: { ...DELIVERED, status: TRACKING_STATUS.CANCELLED },
    });

    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(result.current.phase).toBe('ready'));

    expect(subscribe).not.toHaveBeenCalled();
    expect(result.current.isLive).toBe(false);
  });

  it('drops a fix that arrives after the delivery has ended', async () => {
    const { result } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    const socket = handlers();
    act(() => socket.onState(DELIVERED));
    act(() => socket.onLocation({ latitude: 29.99, longitude: 32.51, updatedAt: null }));

    // No last-known-position replay: a finished delivery has no live marker.
    expect(result.current.tracking?.location).toBeNull();
  });
});

describe('useTracking — analytics and cleanup', () => {
  it('reports a live start and a connection failure exactly once each', async () => {
    const onLiveStarted = vi.fn();
    const onConnectionFailed = vi.fn();
    renderHook(() => useTracking(TOKEN, { onLiveStarted, onConnectionFailed }));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    act(() => handlers().onConnectionChange('connected'));
    act(() => handlers().onConnectionChange('reconnecting'));
    act(() => handlers().onConnectionChange('connected'));
    expect(onLiveStarted).toHaveBeenCalledTimes(1);

    act(() => handlers().onConnectionChange('failed'));
    act(() => handlers().onConnectionChange('failed'));
    expect(onConnectionFailed).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on unmount', async () => {
    const unsubscribe = vi.fn();
    subscribe.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('aborts an in-flight initial fetch on unmount', async () => {
    let captured: AbortSignal | undefined;
    getTracking.mockImplementation((_token, signal) => {
      captured = signal;
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() => useTracking(TOKEN));
    await waitFor(() => expect(captured).toBeDefined());

    unmount();
    expect(captured?.aborted).toBe(true);
  });
});
