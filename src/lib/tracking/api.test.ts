import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackingApi } from './api';
import { TRACKING_STATUS } from './contract';

const TOKEN = '8KX29M4PZQ7RTV';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('trackingApi.getTracking', () => {
  it('calls the public endpoint with no credentials of any kind', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'PICKED_UP' }));

    await trackingApi.getTracking(TOKEN);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(new RegExp(`/public/tracking/${TOKEN}$`));
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect(init.credentials).toBe('omit');
    expect(init.referrerPolicy).toBe('no-referrer');
    expect(JSON.stringify(init.headers)).not.toMatch(/authorization/i);
  });

  it('percent-encodes the token rather than pasting it into the path', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'PICKED_UP' }));

    await trackingApi.getTracking('a b/c');

    expect(fetchMock.mock.calls[0][0]).toMatch(/a%20b%2Fc$/);
  });

  it('returns normalized state on success', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        status: 'COURIER_ASSIGNED',
        isTrackingActive: true,
        location: { latitude: 29.97, longitude: 32.53 },
      }),
    );

    const result = await trackingApi.getTracking(TOKEN);

    expect(result).toEqual({
      ok: true,
      state: expect.objectContaining({ status: TRACKING_STATUS.COURIER_ASSIGNED }),
    });
  });

  it('maps 404 to a dead link', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'internal detail' }, 404));

    await expect(trackingApi.getTracking(TOKEN)).resolves.toEqual({
      ok: false,
      error: { kind: 'not_found' },
    });
  });

  it('maps a rate-limit response to retryable, not to a dead link', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 429));

    await expect(trackingApi.getTracking(TOKEN)).resolves.toEqual({
      ok: false,
      error: { kind: 'unavailable' },
    });
  });

  it('maps a server fault to retryable, not to a dead link', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'stack trace' }, 500));

    await expect(trackingApi.getTracking(TOKEN)).resolves.toEqual({
      ok: false,
      error: { kind: 'unavailable' },
    });
  });

  it('swallows network faults instead of throwing at the UI', async () => {
    fetchMock.mockRejectedValue(new Error('getaddrinfo ENOTFOUND fawran-backend'));

    await expect(trackingApi.getTracking(TOKEN)).resolves.toEqual({
      ok: false,
      error: { kind: 'unavailable' },
    });
  });

  it('treats an unparseable body as unavailable', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    } as unknown as Response);

    await expect(trackingApi.getTracking(TOKEN)).resolves.toEqual({
      ok: false,
      error: { kind: 'unavailable' },
    });
  });

  it('never leaks a backend error message into the result', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { statusCode: 404, message: 'PriceSlot 3f8b7c1e not found', stack: 'at Repository...' },
        404,
      ),
    );

    const result = await trackingApi.getTracking(TOKEN);

    expect(JSON.stringify(result)).not.toContain('PriceSlot');
    expect(JSON.stringify(result)).not.toContain('3f8b7c1e');
    expect(JSON.stringify(result)).not.toContain('stack');
  });
});
