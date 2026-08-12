'use client';

import { usePathname } from 'next/navigation';
import { GoogleAnalytics } from '@next/third-parties/google';
import TrackingAnalytics from './TrackingAnalytics';

/** `/track/TOKEN` and `/{locale}/track/TOKEN`. */
const TRACKING_ROUTE = /^\/(?:[a-z]{2}\/)?track\//;

/**
 * Picks the GA wiring for the current route.
 *
 * Everywhere except the tracking page, the stock @next/third-parties component
 * is used unchanged. The tracking page gets a hand-configured tag instead,
 * because the stock one would report a URL containing the tracking token.
 * Same provider, same measurement id — only the reported path differs.
 */
export default function AnalyticsRouter({ gaId }: { gaId: string }) {
  const pathname = usePathname();

  if (pathname && TRACKING_ROUTE.test(pathname)) {
    return <TrackingAnalytics gaId={gaId} />;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
