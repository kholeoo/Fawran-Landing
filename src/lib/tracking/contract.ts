/**
 * Public receiver tracking — wire contract.
 *
 * Mirrors `docs/public-delivery-tracking-contract.md` in fawran-backend. The
 * backend owns this shape; nothing here invents a field. The public surface is
 * status, isTrackingActive, isFinal, location, destination, fees, courier.
 * Client name/phone stay off this payload. Courier identity is on it so a
 * receiver who is not a Fawran user can recognise and call the rider.
 *
 * Pure and dependency-free so the parsing is testable on its own.
 */

/**
 * The six statuses the backend publishes. There is no seventh, and no
 * receiver-facing state that the backend does not name.
 */
export const TRACKING_STATUS = {
  SEARCHING: 'SEARCHING',
  COURIER_ASSIGNED: 'COURIER_ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type TrackingStatus = (typeof TRACKING_STATUS)[keyof typeof TRACKING_STATUS];

const KNOWN_STATUSES = new Set<string>(Object.values(TRACKING_STATUS));

/**
 * States the backend marks `isFinal`. `isFinal` on the payload is authoritative
 * — this list only covers the case where it is missing or malformed.
 */
export const TERMINAL_STATUSES: readonly TrackingStatus[] = [
  TRACKING_STATUS.DELIVERED,
  TRACKING_STATUS.CANCELLED,
  TRACKING_STATUS.EXPIRED,
];

export function isTerminalStatus(status: TrackingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** A known status, or null when the backend sends something we have no copy for. */
export function parseStatus(raw: unknown): TrackingStatus | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toUpperCase();
  return KNOWN_STATUSES.has(normalized) ? (normalized as TrackingStatus) : null;
}

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type CourierLocation = GeoPoint & {
  /** Server clock for this fix. Always display it rather than assuming "now". */
  updatedAt: string | null;
};

export type TrackingCourier = {
  name: string;
  mobile: string;
};

export type TrackingState = {
  status: TrackingStatus;
  /** False means there is no live courier position — and `location` is null. */
  isTrackingActive: boolean;
  /** Delivered, cancelled or expired. Nothing further will arrive. */
  isFinal: boolean;
  location: CourierLocation | null;
  /** Null when the client sent no coordinates — render without a pin. */
  destination: GeoPoint | null;
  /** This drop-off's delivery fee. Null when the payload omitted it. `0` is a real fee. */
  fees: number | null;
  /** Assigned rider, or null while SEARCHING / unassigned / missing on the wire. */
  courier: TrackingCourier | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Reject nonsense coordinates rather than flying the map to null island. */
function isValidLatLng(latitude: unknown, longitude: unknown): boolean {
  return (
    isFiniteNumber(latitude) &&
    isFiniteNumber(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asIsoString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

export function normalizePoint(raw: unknown): GeoPoint | null {
  const record = asRecord(raw);
  if (!record) return null;
  if (!isValidLatLng(record.latitude, record.longitude)) return null;

  return {
    latitude: record.latitude as number,
    longitude: record.longitude as number,
  };
}

export function normalizeLocation(raw: unknown): CourierLocation | null {
  const point = normalizePoint(raw);
  if (!point) return null;

  return { ...point, updatedAt: asIsoString(asRecord(raw)?.updatedAt) };
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Drop-off fee. Missing or junk → null. `0` is kept. */
export function normalizeFees(raw: unknown): number | null {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0) return null;
  return raw;
}

export function normalizeCourier(raw: unknown): TrackingCourier | null {
  const record = asRecord(raw);
  if (!record) return null;
  const name = asNonEmptyString(record.name);
  const mobile = asNonEmptyString(record.mobile);
  if (!name || !mobile) return null;
  return { name, mobile };
}

/**
 * Normalize the public state, used for both the REST body and the
 * `tracking:status` / subscribe-ack payloads — they are the same shape.
 *
 * Returns null when the payload is unusable. A missing or unrecognized status
 * is not a hard failure: an added backend state should not break a page that is
 * otherwise being told the truth, so it resolves by what the payload says about
 * activity (see `fallbackStatus`). Missing `fees` / `courier` become null so an
 * older payload still renders the map.
 */
export function normalizeTrackingState(raw: unknown): TrackingState | null {
  const record = asRecord(raw);
  if (!record) return null;

  // Tolerate a `{ data }` or `{ tracking }` envelope — the subscribe ack nests
  // the same object under `tracking`.
  const body = asRecord(record.tracking) ?? asRecord(record.data) ?? record;

  const isTrackingActive = body.isTrackingActive === true;
  const parsed = parseStatus(body.status);
  const isFinal =
    typeof body.isFinal === 'boolean'
      ? body.isFinal
      : parsed
        ? isTerminalStatus(parsed)
        : false;

  const status = parsed ?? fallbackStatus(isTrackingActive, isFinal);

  // The backend guarantees `location` is null whenever tracking is inactive.
  // Enforcing it here too means a page can never draw a stale courier pin over
  // a finished delivery, whatever arrives on the wire.
  const location = isTrackingActive ? normalizeLocation(body.location) : null;

  return {
    status,
    isTrackingActive,
    isFinal,
    location,
    destination: normalizePoint(body.destination),
    fees: normalizeFees(body.fees),
    courier: normalizeCourier(body.courier),
  };
}

/**
 * Copy we can stand behind for a status this build has never heard of: if the
 * delivery is over, "tracking has ended" is true of any final state; if it is
 * live, "on the way" is true of any active one.
 */
function fallbackStatus(isTrackingActive: boolean, isFinal: boolean): TrackingStatus {
  if (isFinal) return TRACKING_STATUS.EXPIRED;
  return isTrackingActive ? TRACKING_STATUS.IN_TRANSIT : TRACKING_STATUS.SEARCHING;
}

/** Normalize a `tracking:location` push. Null means "ignore this event". */
export function normalizeLocationEvent(raw: unknown): CourierLocation | null {
  return normalizeLocation(raw);
}

/**
 * Guard against a token that is really an internal id, mirroring mobile's
 * `publicTrackingUrlExposesInternalId`. The backend answers 404 for these
 * anyway; rejecting them here saves a request against a 30/min rate limit and
 * keeps a leaked database id out of an outbound URL entirely.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[A-Za-z0-9._~-]{8,128}$/;

export function isValidTrackingToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const trimmed = token.trim();
  if (!TOKEN_RE.test(trimmed)) return false;
  return !UUID_RE.test(trimmed);
}
