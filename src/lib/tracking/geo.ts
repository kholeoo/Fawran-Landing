/**
 * Small geodesy helpers for the tracking map.
 *
 * The public contract carries no heading, so the courier marker's facing is
 * derived from consecutive fixes. That is two points held in memory, not a
 * route history — the backend keeps no GPS trail and neither does this page.
 */

import type { GeoPoint } from './contract';

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Initial bearing from one point to another, in degrees clockwise from north. */
export function bearingBetween(from: GeoPoint, to: GeoPoint): number {
  const deltaLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Rough metre distance between two points (equirectangular approximation —
 * accurate well past the scale of a city delivery).
 */
export function distanceMeters(from: GeoPoint, to: GeoPoint): number {
  const EARTH_RADIUS_M = 6_371_000;
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const x = toRadians(to.longitude - from.longitude) * Math.cos((lat1 + lat2) / 2);
  const y = lat2 - lat1;

  return Math.sqrt(x * x + y * y) * EARTH_RADIUS_M;
}
