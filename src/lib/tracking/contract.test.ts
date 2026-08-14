import { describe, expect, it } from 'vitest';
import {
  TRACKING_STATUS,
  isTerminalStatus,
  isValidTrackingToken,
  normalizeLocationEvent,
  normalizeTrackingState,
  parseStatus,
} from './contract';

describe('isValidTrackingToken', () => {
  it('accepts an opaque backend token', () => {
    expect(isValidTrackingToken('8KX29M4PZQ7RTV')).toBe(true);
    expect(isValidTrackingToken('tok_abc-123.XY~z')).toBe(true);
  });

  it('rejects a UUID, which would mean an internal id leaked into a public URL', () => {
    expect(isValidTrackingToken('3f8b7c1e-9a2d-4e5f-8b1c-2d3e4f5a6b7c')).toBe(false);
  });

  it('rejects empty, short, and structurally impossible tokens', () => {
    expect(isValidTrackingToken('')).toBe(false);
    expect(isValidTrackingToken(undefined)).toBe(false);
    expect(isValidTrackingToken(null)).toBe(false);
    expect(isValidTrackingToken('1')).toBe(false);
    expect(isValidTrackingToken('abc')).toBe(false);
    expect(isValidTrackingToken('a'.repeat(129))).toBe(false);
  });

  it('rejects tokens carrying path or query characters', () => {
    expect(isValidTrackingToken('abc/../secret')).toBe(false);
    expect(isValidTrackingToken('abcdefgh?admin=1')).toBe(false);
    expect(isValidTrackingToken('<script>alert</script>')).toBe(false);
  });
});

describe('parseStatus', () => {
  it('accepts exactly the six statuses the backend publishes', () => {
    for (const status of Object.values(TRACKING_STATUS)) {
      expect(parseStatus(status)).toBe(status);
    }
  });

  it('is case and whitespace insensitive', () => {
    expect(parseStatus('  in_transit ')).toBe(TRACKING_STATUS.IN_TRANSIT);
  });

  it('rejects anything else rather than inventing a state', () => {
    expect(parseStatus('PICKED_UP')).toBeNull();
    expect(parseStatus('SOMETHING_NEW')).toBeNull();
    expect(parseStatus(undefined)).toBeNull();
    expect(parseStatus(42)).toBeNull();
  });
});

describe('isTerminalStatus', () => {
  it('treats delivered, cancelled and expired as final', () => {
    expect(isTerminalStatus(TRACKING_STATUS.DELIVERED)).toBe(true);
    expect(isTerminalStatus(TRACKING_STATUS.CANCELLED)).toBe(true);
    expect(isTerminalStatus(TRACKING_STATUS.EXPIRED)).toBe(true);
  });

  it('treats everything in flight as non-final', () => {
    expect(isTerminalStatus(TRACKING_STATUS.SEARCHING)).toBe(false);
    expect(isTerminalStatus(TRACKING_STATUS.COURIER_ASSIGNED)).toBe(false);
    expect(isTerminalStatus(TRACKING_STATUS.IN_TRANSIT)).toBe(false);
  });
});

describe('normalizeTrackingState', () => {
  const inTransit = {
    status: 'IN_TRANSIT',
    isTrackingActive: true,
    isFinal: false,
    location: {
      latitude: 29.9792,
      longitude: 31.1342,
      updatedAt: '2026-08-12T10:42:31.000Z',
    },
    destination: { latitude: 29.985, longitude: 31.14 },
  };

  it('reads a payload that omits fees and courier without failing the page', () => {
    expect(normalizeTrackingState(inTransit)).toEqual({
      status: TRACKING_STATUS.IN_TRANSIT,
      isTrackingActive: true,
      isFinal: false,
      location: {
        latitude: 29.9792,
        longitude: 31.1342,
        updatedAt: '2026-08-12T10:42:31.000Z',
      },
      destination: { latitude: 29.985, longitude: 31.14 },
      fees: null,
      courier: null,
    });
  });

  it('unwraps the subscribe ack, which nests the same object under `tracking`', () => {
    expect(normalizeTrackingState({ ok: true, tracking: inTransit })?.status).toBe(
      TRACKING_STATUS.IN_TRANSIT,
    );
  });

  it('reads SEARCHING as a normal first state, not an error', () => {
    expect(
      normalizeTrackingState({
        status: 'SEARCHING',
        isTrackingActive: false,
        isFinal: false,
        location: null,
        destination: { latitude: 29.985, longitude: 31.14 },
      }),
    ).toEqual({
      status: TRACKING_STATUS.SEARCHING,
      isTrackingActive: false,
      isFinal: false,
      location: null,
      destination: { latitude: 29.985, longitude: 31.14 },
      fees: null,
      courier: null,
    });
  });

  it('renders a delivery with no destination coordinates rather than guessing one', () => {
    expect(normalizeTrackingState({ ...inTransit, destination: null })?.destination).toBeNull();
  });

  it('drops any location the backend sends while tracking is inactive', () => {
    // Defence in depth: the contract says this cannot happen, and the page must
    // not draw a ghost courier over a finished delivery if it ever does.
    const state = normalizeTrackingState({
      status: 'DELIVERED',
      isTrackingActive: false,
      isFinal: true,
      location: { latitude: 29.9792, longitude: 31.1342 },
      destination: null,
    });

    expect(state?.location).toBeNull();
    expect(state?.isFinal).toBe(true);
  });

  it('trusts isFinal from the payload', () => {
    expect(normalizeTrackingState({ ...inTransit, isFinal: true })?.isFinal).toBe(true);
  });

  it('falls back to the status when isFinal is missing', () => {
    expect(
      normalizeTrackingState({ status: 'CANCELLED', isTrackingActive: false })?.isFinal,
    ).toBe(true);
    expect(normalizeTrackingState({ status: 'IN_TRANSIT', isTrackingActive: true })?.isFinal).toBe(
      false,
    );
  });

  it('describes an unknown status by what the payload says about the delivery', () => {
    // A backend addition should not break a page that is otherwise being told
    // the truth: "on the way" for a live one, "tracking ended" for a final one.
    expect(
      normalizeTrackingState({ status: 'BRAND_NEW', isTrackingActive: true, isFinal: false })
        ?.status,
    ).toBe(TRACKING_STATUS.IN_TRANSIT);

    expect(
      normalizeTrackingState({ status: 'BRAND_NEW', isTrackingActive: false, isFinal: true })
        ?.status,
    ).toBe(TRACKING_STATUS.EXPIRED);

    expect(
      normalizeTrackingState({ status: 'BRAND_NEW', isTrackingActive: false, isFinal: false })
        ?.status,
    ).toBe(TRACKING_STATUS.SEARCHING);
  });

  it('drops coordinates that are out of range or null island', () => {
    expect(
      normalizeTrackingState({
        ...inTransit,
        location: { latitude: 999, longitude: 31.13 },
      })?.location,
    ).toBeNull();

    expect(
      normalizeTrackingState({ ...inTransit, destination: { latitude: 0, longitude: 0 } })
        ?.destination,
    ).toBeNull();
  });

  it('ignores a malformed timestamp instead of rendering "NaN ago"', () => {
    expect(
      normalizeTrackingState({
        ...inTransit,
        location: { latitude: 29.97, longitude: 31.13, updatedAt: 'not-a-date' },
      })?.location?.updatedAt,
    ).toBeNull();
  });

  it('returns null only when the body is not an object', () => {
    expect(normalizeTrackingState(null)).toBeNull();
    expect(normalizeTrackingState('nope')).toBeNull();
    expect(normalizeTrackingState([])).toBeNull();
  });

  it('reads fees and courier when the backend whitelist includes them', () => {
    expect(
      normalizeTrackingState({
        ...inTransit,
        fees: 30,
        courier: { name: 'أحمد محمد', mobile: '01208741247' },
      }),
    ).toEqual({
      status: TRACKING_STATUS.IN_TRANSIT,
      isTrackingActive: true,
      isFinal: false,
      location: {
        latitude: 29.9792,
        longitude: 31.1342,
        updatedAt: '2026-08-12T10:42:31.000Z',
      },
      destination: { latitude: 29.985, longitude: 31.14 },
      fees: 30,
      courier: { name: 'أحمد محمد', mobile: '01208741247' },
    });
  });

  it('keeps a zero fee and drops junk fees/courier instead of failing the page', () => {
    expect(normalizeTrackingState({ ...inTransit, fees: 0 })?.fees).toBe(0);
    expect(normalizeTrackingState({ ...inTransit, fees: -1 })?.fees).toBeNull();
    expect(normalizeTrackingState({ ...inTransit, fees: '30' })?.fees).toBeNull();
    expect(
      normalizeTrackingState({
        ...inTransit,
        courier: { name: 'أحمد', mobile: '   ' },
      })?.courier,
    ).toBeNull();
    expect(
      normalizeTrackingState({ ...inTransit, courier: { name: 'أحمد' } })?.courier,
    ).toBeNull();
  });
});

describe('normalizeLocationEvent', () => {
  it('reads a tracking:location push', () => {
    expect(
      normalizeLocationEvent({
        latitude: 29.9792,
        longitude: 31.1342,
        updatedAt: '2026-08-12T10:42:31.000Z',
      }),
    ).toEqual({
      latitude: 29.9792,
      longitude: 31.1342,
      updatedAt: '2026-08-12T10:42:31.000Z',
    });
  });

  it('keeps a fix that arrives without a timestamp', () => {
    expect(normalizeLocationEvent({ latitude: 29.97, longitude: 31.13 })).toEqual({
      latitude: 29.97,
      longitude: 31.13,
      updatedAt: null,
    });
  });

  it('drops events we cannot trust', () => {
    expect(normalizeLocationEvent(null)).toBeNull();
    expect(normalizeLocationEvent({ latitude: 'x', longitude: 31.13 })).toBeNull();
    expect(normalizeLocationEvent({ latitude: Number.NaN, longitude: 31.13 })).toBeNull();
    expect(normalizeLocationEvent({ latitude: 29.97 })).toBeNull();
    expect(normalizeLocationEvent({ latitude: 91, longitude: 31.13 })).toBeNull();
    // The internal lat/lng shape is not part of the public contract.
    expect(normalizeLocationEvent({ lat: 29.97, lng: 31.13 })).toBeNull();
  });
});
