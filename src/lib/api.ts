/**
 * Backend endpoints reachable from the browser.
 *
 * Only unauthenticated, publicly documented routes are ever called from this
 * site, so the base URL is a NEXT_PUBLIC_ variable by design. No credential of
 * any kind belongs in this module.
 */

const DEFAULT_API_URL = 'https://fawran-backend.onrender.com/api/v1';

function normalize(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

/** e.g. https://fawran-backend.onrender.com/api/v1 */
export const apiBaseUrl = normalize(process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL);

/**
 * Origin for socket.io — the API base without its version prefix. Mirrors the
 * mobile app's `lib/socket.ts`, which derives the same value the same way, so
 * one env var configures both transports.
 */
export const realtimeOrigin = apiBaseUrl.replace(/\/api\/v\d+$/, '');
