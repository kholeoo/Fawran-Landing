import AnalyticsRouter from './AnalyticsRouter';

// Renders gtag.js only when a measurement id is configured. It fires on the
// production deployment (including the placeholder *.vercel.app URL, so the
// integration can be validated before the real domain exists), but never on
// preview deploys or local `next dev`, so only real traffic reaches GA4.
//
// The enabled check stays in a server component: VERCEL_ENV is not a
// NEXT_PUBLIC_ variable, so it reads as undefined in client code and the
// preview guard would silently pass.
export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  const enabled =
    !!gaId &&
    process.env.NODE_ENV === 'production' &&
    process.env.VERCEL_ENV !== 'preview';

  if (!enabled) {
    return null;
  }

  return <AnalyticsRouter gaId={gaId!} />;
}
