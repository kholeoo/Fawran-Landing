import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRACKING_STATUS } from './contract';
import type { TrackingConnectionState, TrackingSubscribeError } from './socket';

const TOKEN = '8KX29M4PZQ7RTV';

const IN_TRANSIT = {
  status: 'IN_TRANSIT',
  isTrackingActive: true,
  isFinal: false,
  location: { latitude: 29.9792, longitude: 31.1342, updatedAt: '2026-08-12T10:42:31.000Z' },
  destination: { latitude: 29.985, longitude: 31.14 },
};

/** Minimal socket.io double: records handlers so tests can fire events. */
function createFakeSocket() {
  const handlers = new Map<string, ((payload?: unknown) => void)[]>();
  const managerHandlers = new Map<string, ((payload?: unknown) => void)[]>();

  const register = (
    store: Map<string, ((payload?: unknown) => void)[]>,
    event: string,
    handler: (payload?: unknown) => void,
  ) => {
    store.set(event, [...(store.get(event) ?? []), handler]);
  };

  const socket = {
    connected: true,
    handlers,
    managerHandlers,
    /** Queued replies for emitWithAck, in call order. */
    acks: [] as unknown[],
    emit: vi.fn(),
    emitWithAck: vi.fn(async () => socket.acks.shift()),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
    timeout: vi.fn(() => socket),
    on: vi.fn((event: string, handler: (payload?: unknown) => void) => {
      register(handlers, event, handler);
    }),
    io: {
      on: vi.fn((event: string, handler: (payload?: unknown) => void) => {
        register(managerHandlers, event, handler);
      }),
      removeAllListeners: vi.fn(),
    },
    fire(event: string, payload?: unknown) {
      for (const handler of handlers.get(event) ?? []) handler(payload);
    },
    fireManager(event: string, payload?: unknown) {
      for (const handler of managerHandlers.get(event) ?? []) handler(payload);
    },
  };

  return socket;
}

let socket = createFakeSocket();
const io = vi.fn(() => socket);

vi.mock('socket.io-client', () => ({ io: (...args: unknown[]) => io(...(args as [])) }));

const { trackingSocket } = await import('./socket');

/** Let the lazy import and the ack promise settle. */
const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
};

function subscribe() {
  const onState = vi.fn();
  const onLocation = vi.fn();
  const onSubscribeError = vi.fn();
  const states: TrackingConnectionState[] = [];

  const unsubscribe = trackingSocket.subscribe(TOKEN, {
    onState,
    onLocation,
    onSubscribeError,
    onConnectionChange: (state) => states.push(state),
  });

  return { onState, onLocation, onSubscribeError, states, unsubscribe };
}

beforeEach(() => {
  socket = createFakeSocket();
  io.mockClear();
  io.mockImplementation(() => socket);
});

describe('trackingSocket.subscribe', () => {
  it('connects anonymously to the public namespace', async () => {
    subscribe();
    await flush();

    expect(io).toHaveBeenCalledTimes(1);
    const [url, options] = io.mock.calls[0] as unknown as [string, Record<string, unknown>];

    expect(url).toMatch(/\/public-tracking$/);
    expect(options.reconnection).toBe(true);
    // A public page must not ride on a shared, possibly authenticated socket.
    expect(options.forceNew).toBe(true);
    // No credentials of any kind reach the handshake.
    expect(options.auth).toBeUndefined();
    expect(JSON.stringify(options)).not.toMatch(/token|authorization/i);
  });

  it('subscribes on connect and adopts the ack as fresh state', async () => {
    socket.acks.push({ ok: true, tracking: IN_TRANSIT });
    const { onState, states } = subscribe();
    await flush();

    socket.fire('connect');
    await flush();

    expect(socket.emitWithAck).toHaveBeenCalledWith('tracking:subscribe', {
      trackingToken: TOKEN,
    });
    expect(onState).toHaveBeenCalledTimes(1);
    expect(onState.mock.calls[0][0]).toMatchObject({ status: TRACKING_STATUS.IN_TRANSIT });
    expect(states.at(-1)).toBe('connected');
  });

  it('re-subscribes on every connect, since rooms do not survive a reconnect', async () => {
    socket.acks.push({ ok: true, tracking: IN_TRANSIT }, { ok: true, tracking: IN_TRANSIT });
    subscribe();
    await flush();

    socket.fire('connect');
    await flush();
    socket.fire('disconnect', 'transport close');
    socket.fire('connect');
    await flush();

    expect(socket.emitWithAck).toHaveBeenCalledTimes(2);
  });

  it('is not "connected" until the subscription is actually accepted', async () => {
    socket.acks.push({ ok: false, error: 'TRACKING_NOT_FOUND' });
    const { states, onSubscribeError } = subscribe();
    await flush();

    socket.fire('connect');
    await flush();

    expect(states).not.toContain('connected');
    expect(states.at(-1)).toBe('failed');
    expect(onSubscribeError).toHaveBeenCalledWith('TRACKING_NOT_FOUND');
  });

  it('passes through each rejection reason in the contract', async () => {
    const cases: TrackingSubscribeError[] = [
      'INVALID_PAYLOAD',
      'TRACKING_NOT_FOUND',
      'TOO_MANY_SUBSCRIPTIONS',
    ];

    for (const error of cases) {
      socket = createFakeSocket();
      io.mockImplementation(() => socket);
      socket.acks.push({ ok: false, error });

      const { onSubscribeError } = subscribe();
      await flush();
      socket.fire('connect');
      await flush();

      expect(onSubscribeError).toHaveBeenCalledWith(error);
    }
  });

  it('labels an unrecognized rejection rather than trusting it', async () => {
    socket.acks.push({ ok: false, error: 'SOMETHING_ELSE' });
    const { onSubscribeError } = subscribe();
    await flush();

    socket.fire('connect');
    await flush();

    expect(onSubscribeError).toHaveBeenCalledWith('UNKNOWN');
  });

  it('treats an ack timeout as retryable, not as a dead link', async () => {
    socket.emitWithAck.mockRejectedValueOnce(new Error('operation has timed out'));
    const { states, onSubscribeError } = subscribe();
    await flush();

    socket.fire('connect');
    await flush();

    expect(states.at(-1)).toBe('reconnecting');
    expect(onSubscribeError).not.toHaveBeenCalled();
  });

  it('forwards location pushes', async () => {
    const { onLocation } = subscribe();
    await flush();

    socket.fire('tracking:location', {
      latitude: 29.98,
      longitude: 31.14,
      updatedAt: '2026-08-12T10:43:00.000Z',
    });

    expect(onLocation).toHaveBeenCalledWith({
      latitude: 29.98,
      longitude: 31.14,
      updatedAt: '2026-08-12T10:43:00.000Z',
    });
  });

  it('drops malformed location pushes instead of forwarding them', async () => {
    const { onLocation } = subscribe();
    await flush();

    socket.fire('tracking:location', { latitude: 'north', longitude: 31.13 });
    socket.fire('tracking:location', null);
    socket.fire('tracking:location', { latitude: 0, longitude: 0 });

    expect(onLocation).not.toHaveBeenCalled();
  });

  it('treats a status push as a whole new state', async () => {
    const { onState } = subscribe();
    await flush();

    socket.fire('tracking:status', {
      status: 'DELIVERED',
      isTrackingActive: false,
      isFinal: true,
      location: null,
      destination: null,
    });

    expect(onState).toHaveBeenCalledWith({
      status: TRACKING_STATUS.DELIVERED,
      isTrackingActive: false,
      isFinal: true,
      location: null,
      destination: null,
      fees: null,
      courier: null,
    });
  });
});

describe('trackingSocket — connection lifecycle', () => {
  it('treats a transport drop as reconnecting', async () => {
    const { states } = subscribe();
    await flush();

    socket.fire('disconnect', 'transport close');
    expect(states.at(-1)).toBe('reconnecting');
  });

  it('treats a server-side disconnect as final, since socket.io will not retry', async () => {
    const { states } = subscribe();
    await flush();

    socket.fire('disconnect', 'io server disconnect');
    expect(states.at(-1)).toBe('failed');
  });

  it('reports failure once reconnection attempts are exhausted', async () => {
    const { states } = subscribe();
    await flush();

    socket.fireManager('reconnect_attempt');
    expect(states.at(-1)).toBe('reconnecting');

    socket.fireManager('reconnect_failed');
    expect(states.at(-1)).toBe('failed');
  });
});

describe('trackingSocket — teardown', () => {
  it('unsubscribes, removes listeners and closes the connection', async () => {
    const { unsubscribe } = subscribe();
    await flush();

    unsubscribe();

    expect(socket.emit).toHaveBeenCalledWith('tracking:unsubscribe', { trackingToken: TOKEN });
    expect(socket.removeAllListeners).toHaveBeenCalled();
    expect(socket.io.removeAllListeners).toHaveBeenCalled();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('never opens a socket when unsubscribed before the client chunk loads', async () => {
    const { unsubscribe } = subscribe();
    unsubscribe();
    await flush();

    expect(io).not.toHaveBeenCalled();
  });

  it('is safe to call twice', async () => {
    const { unsubscribe } = subscribe();
    await flush();

    unsubscribe();
    unsubscribe();

    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('ignores an ack that resolves after teardown', async () => {
    socket.acks.push({ ok: true, tracking: IN_TRANSIT });
    const { onState, unsubscribe } = subscribe();
    await flush();

    socket.fire('connect');
    unsubscribe();
    await flush();

    expect(onState).not.toHaveBeenCalled();
  });
});
