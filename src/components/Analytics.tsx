import { GoogleAnalytics } from '@next/third-parties/google';

// Renders gtag.js only when a measurement id is configured. It fires on the
// production deployment (including the placeholder *.vercel.app URL, so the
// integration can be validated before the real domain exists), but never on
// preview deploys or local `next dev`, so only real traffic reaches GA4.
export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  const enabled =
    !!gaId &&
    process.env.NODE_ENV === 'production' &&
    process.env.VERCEL_ENV !== 'preview';

  if (!enabled) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId!} />;
}
