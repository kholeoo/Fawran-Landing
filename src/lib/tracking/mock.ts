/**
 * Development-only tracking mock.
 *
 * Lets the receiver page be worked on without a live delivery in the backend.
 * It is gated twice — on NODE_ENV and on an explicit opt-in flag — so it cannot
 * reach production even if the flag is set there by mistake. Next inlines both
 * at build time, so a production bundle tree-shakes the scripted route away.
 *
 * Deleting this file and its two call sites in api.ts / socket.ts removes
 * mocking entirely.
 */

import { TRACKING_STATUS, type CourierLocation, type TrackingState } from './contract';

export function isMockEnabled(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_TRACKING_MOCK === '1'
  );
}

// A short run through central Suez — the city Fawran actually operates in.
const ROUTE = [
  { latitude: 29.9668, longitude: 32.5498 },
  { latitude: 29.9691, longitude: 32.5481 },
  { latitude: 29.9714, longitude: 32.5463 },
  { latitude: 29.9736, longitude: 32.5447 },
  { latitude: 29.9758, longitude: 32.5429 },
  { latitude: 29.9779, longitude: 32.5412 },
  { latitude: 29.9798, longitude: 32.5396 },
];

const DESTINATION = { latitude: 29.9812, longitude: 32.5384 };

export function getMockTrackingState(): TrackingState {
  return {
    status: TRACKING_STATUS.IN_TRANSIT,
    isTrackingActive: true,
    isFinal: false,
    location: { ...ROUTE[0], updatedAt: new Date().toISOString() },
    destination: DESTINATION,
  };
}

/**
 * Walk the scripted route, emitting one fix every `intervalMs` — the same ~3s
 * cadence the backend streams at. Returns a teardown with the same shape as the
 * real subscription.
 */
export function startMockLocationFeed(
  onLocation: (location: CourierLocation) => void,
  intervalMs = 3_000,
): () => void {
  let index = 0;

  const timer = setInterval(() => {
    index += 1;
    if (index >= ROUTE.length) {
      clearInterval(timer);
      return;
    }

    onLocation({ ...ROUTE[index], updatedAt: new Date().toISOString() });
  }, intervalMs);

  return () => clearInterval(timer);
}
