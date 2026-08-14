import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrackingSubscriptionHandlers } from '@/lib/tracking/socket';
import type { TrackingFetchResult } from '@/lib/tracking/api';
import { TRACKING_STATUS, type TrackingState } from '@/lib/tracking/contract';
import ar from '@/messages/ar.json';
import en from '@/messages/en.json';

const TOKEN = '8KX29M4PZQ7RTV';

const getTracking = vi.fn<(token: string, signal?: AbortSignal) => Promise<TrackingFetchResult>>();
const subscribe = vi.fn<(token: string, handlers: TrackingSubscriptionHandlers) => () => void>();
const trackEvent = vi.fn();

vi.mock('@/lib/tracking/api', () => ({
  trackingApi: { getTracking: (...args: Parameters<typeof getTracking>) => getTracking(...args) },
}));

vi.mock('@/lib/tracking/socket', () => ({
  trackingSocket: { subscribe: (...args: Parameters<typeof subscribe>) => subscribe(...args) },
}));

vi.mock('@/lib/gtag', () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'ar', trackingToken: TOKEN }),
}));

// MapLibre needs WebGL, which jsdom has none of. The map's own behaviour is out
// of scope here; what this file checks is that the page hands it the right data
// and shows the placeholder when there is none.
vi.mock('next/dynamic', () => ({
  default: () =>
    function MapStub({
      courier,
      destination,
      isActive,
      isStale,
    }: {
      courier: { latitude: number; longitude: number } | null;
      destination: { latitude: number; longitude: number } | null;
      isActive: boolean;
      isStale: boolean;
    }) {
      return (
        <div
          data-testid="tracking-map"
          data-courier={courier ? `${courier.latitude},${courier.longitude}` : ''}
          data-destination={destination ? `${destination.latitude},${destination.longitude}` : ''}
          data-active={String(isActive)}
          data-stale={String(isStale)}
        />
      );
    },
}));

const TrackingExperience = (await import('./TrackingExperience')).default;

const IN_TRANSIT: TrackingState = {
  status: TRACKING_STATUS.IN_TRANSIT,
  isTrackingActive: true,
  isFinal: false,
  location: { latitude: 29.9668, longitude: 32.5498, updatedAt: new Date().toISOString() },
  destination: { latitude: 29.9812, longitude: 32.5384 },
  fees: 30,
  courier: { name: 'أحمد محمد', mobile: '01208741247' },
};

const SEARCHING: TrackingState = {
  status: TRACKING_STATUS.SEARCHING,
  isTrackingActive: false,
  isFinal: false,
  location: null,
  destination: null,
  fees: 30,
  courier: null,
};

const DELIVERED: TrackingState = {
  status: TRACKING_STATUS.DELIVERED,
  isTrackingActive: false,
  isFinal: true,
  location: null,
  destination: { latitude: 29.9812, longitude: 32.5384 },
  fees: 30,
  courier: { name: 'أحمد محمد', mobile: '01208741247' },
};

function renderPage(locale: 'ar' | 'en' = 'ar') {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === 'ar' ? ar : en}>
      <TrackingExperience token={TOKEN} />
    </NextIntlClientProvider>,
  );
}

function handlers(): TrackingSubscriptionHandlers {
  return subscribe.mock.calls[subscribe.mock.calls.length - 1][1];
}

beforeEach(() => {
  getTracking.mockReset();
  subscribe.mockReset();
  trackEvent.mockReset();
  getTracking.mockResolvedValue({ ok: true, state: IN_TRANSIT });
  subscribe.mockReturnValue(() => {});
});

describe('tracking page — Arabic', () => {
  it('answers "where is my delivery?" in the first viewport', async () => {
    renderPage('ar');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'المندوب في الطريق إليك',
    );
    expect(screen.getByText('تتبع طلبك')).toBeInTheDocument();
    expect(screen.getByText(/آخر تحديث/)).toBeInTheDocument();
    expect(screen.getByTestId('tracking-map')).toBeInTheDocument();
    expect(screen.getByText('رسوم التوصيل')).toBeInTheDocument();
    expect(screen.getByText('30 ج.م')).toBeInTheDocument();
    expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'اتصال' })).toHaveAttribute(
      'href',
      'tel:+201208741247',
    );

    act(() => handlers().onConnectionChange('connected'));
    expect(screen.getByText('مباشر')).toBeInTheDocument();
  });

  it('says "connecting", not "reconnecting", before the socket has ever been up', async () => {
    renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getByText('جارٍ الاتصال…')).toBeInTheDocument();
    expect(screen.queryByText('مباشر')).not.toBeInTheDocument();
  });

  it('renders no marketing sections', async () => {
    renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    // Copy that only exists on the landing page.
    expect(screen.queryByText(/حمّل التطبيق/)).not.toBeInTheDocument();
    expect(screen.queryByText('لماذا فورًا؟')).not.toBeInTheDocument();
    expect(screen.queryByText('تواصل معنا')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('keeps the receiver on the same delivery when switching language', async () => {
    renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    expect(screen.getByRole('link', { name: 'EN' })).toHaveAttribute('href', `/en/track/${TOKEN}`);
  });
});

describe('tracking page — English', () => {
  it('renders the English status', async () => {
    renderPage('en');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Your courier is on the way',
    );
    expect(screen.getByText(/Updated/)).toBeInTheDocument();

    act(() => handlers().onConnectionChange('connected'));
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});

describe('tracking page — map', () => {
  it('passes the courier and destination through to the map', async () => {
    renderPage('ar');

    const map = await screen.findByTestId('tracking-map');
    expect(map).toHaveAttribute('data-courier', '29.9668,32.5498');
    expect(map).toHaveAttribute('data-destination', '29.9812,32.5384');
    expect(map).toHaveAttribute('data-active', 'true');
  });

  it('moves the courier on a socket update, without refetching', async () => {
    renderPage('ar');
    await screen.findByTestId('tracking-map');

    act(() =>
      handlers().onLocation({
        latitude: 29.9714,
        longitude: 32.5463,
        updatedAt: new Date().toISOString(),
      }),
    );

    await waitFor(() =>
      expect(screen.getByTestId('tracking-map')).toHaveAttribute('data-courier', '29.9714,32.5463'),
    );
    expect(getTracking).toHaveBeenCalledTimes(1);
  });

  it('shows the courier without a destination pin when the client sent no coordinates', async () => {
    getTracking.mockResolvedValue({ ok: true, state: { ...IN_TRANSIT, destination: null } });

    renderPage('ar');

    const map = await screen.findByTestId('tracking-map');
    expect(map).toHaveAttribute('data-courier', '29.9668,32.5498');
    expect(map).toHaveAttribute('data-destination', '');
  });

  it('treats SEARCHING as a normal first state, not an empty one', async () => {
    getTracking.mockResolvedValue({ ok: true, state: SEARCHING });

    renderPage('ar');

    expect(await screen.findByText('جاري البحث عن مندوب')).toBeInTheDocument();
    expect(screen.getByText('بننتظر موقع المندوب')).toBeInTheDocument();
    expect(screen.queryByTestId('tracking-map')).not.toBeInTheDocument();
    // Nothing to be live about yet, so no badge claims otherwise.
    expect(screen.queryByText('مباشر')).not.toBeInTheDocument();
    expect(screen.getByText('رسوم التوصيل')).toBeInTheDocument();
    expect(screen.getByText('30 ج.م')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'اتصال' })).not.toBeInTheDocument();
  });
});

describe('tracking page — connection honesty', () => {
  it('drops the live badge the moment the socket goes down', async () => {
    renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    act(() => handlers().onConnectionChange('connected'));
    expect(screen.getByText('مباشر')).toBeInTheDocument();

    act(() => handlers().onConnectionChange('reconnecting'));
    await waitFor(() => expect(screen.queryByText('مباشر')).not.toBeInTheDocument());
    expect(screen.getByText('جارٍ إعادة الاتصال…')).toBeInTheDocument();
  });

  it('greys the marker and warns when the last fix is old', async () => {
    getTracking.mockResolvedValue({
      ok: true,
      state: {
        ...IN_TRANSIT,
        location: {
          ...IN_TRANSIT.location!,
          updatedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
        },
      },
    });

    renderPage('ar');

    expect(await screen.findByText('قد يكون موقع المندوب غير محدث')).toBeInTheDocument();
    expect(screen.getByText(/منذ 10 دقائق/)).toBeInTheDocument();
    expect(screen.getByTestId('tracking-map')).toHaveAttribute('data-stale', 'true');
  });

  it('shows the age without a warning for a fix that is merely a minute old', async () => {
    getTracking.mockResolvedValue({
      ok: true,
      state: {
        ...IN_TRANSIT,
        location: {
          ...IN_TRANSIT.location!,
          updatedAt: new Date(Date.now() - 90_000).toISOString(),
        },
      },
    });

    renderPage('ar');

    expect(await screen.findByText(/منذ دقيقة/)).toBeInTheDocument();
    expect(screen.queryByText('قد يكون موقع المندوب غير محدث')).not.toBeInTheDocument();
  });
});

describe('tracking page — final states', () => {
  it('closes out a delivered run and removes the courier marker', async () => {
    getTracking.mockResolvedValue({ ok: true, state: DELIVERED });

    renderPage('ar');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('تم توصيل الطلب');
    expect(screen.queryByText('مباشر')).not.toBeInTheDocument();

    const map = screen.getByTestId('tracking-map');
    expect(map).toHaveAttribute('data-active', 'false');
    // No last-known-position replay after a delivery ends.
    expect(map).toHaveAttribute('data-courier', '');

    expect(subscribe).not.toHaveBeenCalled();
    // A finished delivery has no live position to age.
    expect(screen.queryByText(/آخر تحديث/)).not.toBeInTheDocument();
  });

  it('shows a final cancelled state', async () => {
    getTracking.mockResolvedValue({
      ok: true,
      state: { ...DELIVERED, status: TRACKING_STATUS.CANCELLED },
    });

    renderPage('ar');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('تم إلغاء الطلب');
  });

  it('shows a final expired state', async () => {
    getTracking.mockResolvedValue({
      ok: true,
      state: { ...DELIVERED, status: TRACKING_STATUS.EXPIRED },
    });

    renderPage('ar');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'انتهت صلاحية التتبع',
    );
  });

  it('settles into delivered when the news arrives over the socket', async () => {
    renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    act(() => handlers().onState(DELIVERED));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('تم توصيل الطلب'),
    );
    expect(screen.queryByText('مباشر')).not.toBeInTheDocument();
    expect(screen.getByTestId('tracking-map')).toHaveAttribute('data-courier', '');
  });
});

describe('tracking page — failure states', () => {
  it('never shows a blank page while loading', () => {
    getTracking.mockImplementation(() => new Promise(() => {}));
    renderPage('ar');

    expect(screen.getByRole('status')).toHaveTextContent('جارٍ تحميل التتبع…');
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('shows one friendly message for an invalid link, with no internals', async () => {
    render(
      <NextIntlClientProvider locale="ar" messages={ar}>
        <TrackingExperience token="short" />
      </NextIntlClientProvider>,
    );

    expect(await screen.findByText('رابط التتبع غير صالح أو لم يعد متاحًا')).toBeInTheDocument();
    expect(screen.queryByTestId('tracking-map')).not.toBeInTheDocument();
    expect(getTracking).not.toHaveBeenCalled();
  });

  it('gives an unresolvable token the same answer', async () => {
    getTracking.mockResolvedValue({ ok: false, error: { kind: 'not_found' } });
    renderPage('ar');

    expect(await screen.findByText('رابط التتبع غير صالح أو لم يعد متاحًا')).toBeInTheDocument();
  });

  it('offers a retry when the backend is unreachable, rather than calling the link dead', async () => {
    getTracking.mockResolvedValue({ ok: false, error: { kind: 'unavailable' } });
    renderPage('ar');

    expect(await screen.findByText('تعذّر تحميل التتبع')).toBeInTheDocument();
    expect(screen.queryByText('رابط التتبع غير صالح أو لم يعد متاحًا')).not.toBeInTheDocument();

    getTracking.mockResolvedValue({ ok: true, state: IN_TRANSIT });
    await userEvent.click(screen.getByRole('button', { name: /إعادة المحاولة/ }));

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('المندوب في الطريق إليك'),
    );
  });
});

describe('tracking page — receiver details', () => {
  it('still renders the map when fees and courier are missing from the payload', async () => {
    getTracking.mockResolvedValue({
      ok: true,
      state: { ...IN_TRANSIT, fees: null, courier: null },
    });

    renderPage('ar');

    expect(await screen.findByTestId('tracking-map')).toBeInTheDocument();
    expect(screen.queryByText('رسوم التوصيل')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'اتصال' })).not.toBeInTheDocument();
  });
});

describe('tracking page — privacy', () => {
  it('never puts the token or coordinates into analytics', async () => {
    renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    act(() => handlers().onConnectionChange('connected'));
    act(() =>
      handlers().onLocation({ latitude: 29.9714, longitude: 32.5463, updatedAt: null }),
    );

    expect(trackEvent).toHaveBeenCalledWith('tracking_page_view', { locale: 'ar' });
    expect(trackEvent).toHaveBeenCalledWith('tracking_started', { locale: 'ar' });

    const serialized = JSON.stringify(trackEvent.mock.calls);
    expect(serialized).not.toContain(TOKEN);
    expect(serialized).not.toContain('29.97');
    expect(serialized).not.toContain('32.54');
  });

  it('renders nothing beyond the public tracking fields', async () => {
    renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    const text = document.body.textContent ?? '';
    expect(text).not.toContain(TOKEN);
    expect(text).not.toContain('29.9668');
  });
});

describe('tracking page — cleanup', () => {
  it('stops the socket when the receiver leaves', async () => {
    const unsubscribe = vi.fn();
    subscribe.mockReturnValue(unsubscribe);

    const { unmount } = renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('clears the freshness interval on unmount', async () => {
    const clearInterval = vi.spyOn(globalThis, 'clearInterval');

    const { unmount } = renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    const before = clearInterval.mock.calls.length;
    unmount();

    expect(clearInterval.mock.calls.length).toBeGreaterThan(before);
  });

  it('never starts a clock for a delivery that has already ended', async () => {
    const setInterval = vi.spyOn(globalThis, 'setInterval');
    getTracking.mockResolvedValue({ ok: true, state: DELIVERED });

    renderPage('ar');
    await screen.findByRole('heading', { level: 1 });

    // Testing Library polls with its own short interval, so match on the
    // one-second tick the page would schedule for freshness.
    const ticks = setInterval.mock.calls.filter(([, delay]) => delay === 1_000);
    expect(ticks).toHaveLength(0);
  });
});
