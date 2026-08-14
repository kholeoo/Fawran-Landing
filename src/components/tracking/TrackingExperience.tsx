'use client';

/**
 * Receiver tracking page shell.
 *
 * Owns the one-second clock that drives freshness (a single timer for the whole
 * page, stopped once the delivery is over) and the analytics calls. The map is
 * memoized, so the tick repaints the text and nothing else.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useTracking } from '@/hooks/useTracking';
import { getFreshness } from '@/lib/tracking/freshness';
import { trackEvent } from '@/lib/gtag';
import TrackingHeader from './TrackingHeader';
import TrackingStatus from './TrackingStatus';
import TrackingReceiverDetails from './TrackingReceiverDetails';
import LastUpdated from './LastUpdated';
import { TrackingError, TrackingInvalid, TrackingLoading } from './TrackingStates';
import { TrackingMapPlaceholder } from './TrackingMap';

// MapLibre is by far the heaviest thing here and is useless during SSR, so it
// loads after the shell paints. The receiver sees brand and status immediately.
const TrackingMap = dynamic(() => import('./TrackingMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#EEF1F8]" />,
});

const TICK_MS = 1_000;

export default function TrackingExperience({ token }: { token: string }) {
  const t = useTranslations('track');
  const locale = useLocale();

  const firedPageView = useRef(false);

  const callbacks = useMemo(
    () => ({
      // Coarse, non-identifying properties only: no token, no coordinates, no
      // ids. The route name never carries the resolved path either — see
      // TrackingAnalytics.
      onLiveStarted: () => trackEvent('tracking_started', { locale }),
      onConnectionFailed: () => trackEvent('tracking_connection_failed', { locale }),
      onCompleted: (status: string) => trackEvent('tracking_completed', { locale, status }),
    }),
    [locale],
  );

  const { phase, tracking, connection, isLive, retry } = useTracking(token, callbacks);

  useEffect(() => {
    if (firedPageView.current) return;
    firedPageView.current = true;
    trackEvent('tracking_page_view', { locale });
  }, [locale]);

  const isFinal = tracking?.isFinal ?? false;

  // One clock for the page. It stops on final states — a finished delivery has
  // nothing left to count.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase !== 'ready' || isFinal) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [phase, isFinal]);

  const shell =
    'tracking-page flex min-h-[100svh] flex-col bg-[#F8F9FC] lg:h-[100svh] lg:overflow-hidden';

  if (phase === 'loading') {
    return (
      <div className={shell}>
        <TrackingHeader />
        <TrackingLoading />
      </div>
    );
  }

  if (phase === 'invalid' || phase === 'not_found') {
    return (
      <div className={shell}>
        <TrackingHeader />
        <main className="flex flex-1 flex-col">
          <TrackingInvalid />
        </main>
      </div>
    );
  }

  if (phase === 'error' || !tracking) {
    return (
      <div className={shell}>
        <TrackingHeader />
        <main className="flex flex-1 flex-col">
          <TrackingError onRetry={retry} />
        </main>
      </div>
    );
  }

  const { status, isTrackingActive, location, destination, fees, courier } = tracking;
  const lastUpdatedAt = location?.updatedAt ?? null;
  const freshness = getFreshness(lastUpdatedAt, now, isLive);
  const hasMapContent = !!location || !!destination;

  return (
    <div className={shell}>
      <TrackingHeader />

      {/*
        DOM order is the mobile reading order — status, map, freshness — and the
        grid re-places the same three nodes into a panel/map split on desktop.
        Nothing is duplicated across breakpoints, so there is one of each live
        region on the page.
      */}
      <main className="grid flex-1 grid-cols-1 grid-rows-[auto_1fr_auto] lg:grid-cols-[380px_1fr] lg:grid-rows-[auto_1fr] lg:overflow-hidden">
        <section className="border-b border-[#E2E6F0] bg-white px-4 py-5 sm:px-6 lg:col-start-1 lg:row-start-1 lg:border-b-0 lg:px-8 lg:pt-8 lg:pb-5">
          <div className="mx-auto max-w-6xl lg:mx-0">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#9BA5BF]">
              {t('heading')}
            </p>
            <TrackingStatus
              status={status}
              isLive={isLive}
              connection={connection}
              // Connection badges only mean something while a courier is
              // actually streaming. SEARCHING has no socket traffic to report.
              showConnection={isTrackingActive}
            />
            <TrackingReceiverDetails fees={fees} courier={courier} />
          </div>
        </section>

        <section className="relative min-h-[50svh] lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:min-h-0 lg:border-s lg:border-[#E2E6F0]">
          {hasMapContent ? (
            <TrackingMap
              courier={location}
              destination={destination}
              isActive={isTrackingActive}
              isStale={freshness.level === 'stale' || freshness.level === 'very_stale'}
            />
          ) : (
            <TrackingMapPlaceholder />
          )}
        </section>

        <section className="border-t border-[#E2E6F0] bg-white px-4 py-4 sm:px-6 lg:col-start-1 lg:row-start-2 lg:flex lg:flex-col lg:justify-start lg:overflow-y-auto lg:border-t-0 lg:px-8 lg:pb-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:mx-0">
            {/* A finished delivery has no live position to age, so the
                freshness line would only be noise. */}
            {!isFinal && (
              <LastUpdated lastUpdatedAt={lastUpdatedAt} now={now} isConnected={isLive} />
            )}

            <p className="text-[11px] leading-relaxed text-[#9BA5BF]">{t('privacy_note')}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
