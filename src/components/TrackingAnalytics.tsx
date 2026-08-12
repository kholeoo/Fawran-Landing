'use client';

import Script from 'next/script';

/**
 * GA4 for the receiver tracking page, configured so the tracking token never
 * leaves the browser.
 *
 * `<GoogleAnalytics>` from @next/third-parties emits a bare `gtag('config', id)`,
 * and gtag then reads `document.location.href` for the automatic page_view —
 * which on this route contains the token. So this route gets the same provider
 * and the same measurement id, wired by hand with `page_location` and
 * `page_path` pinned to a literal route name.
 *
 * The path is reported as `/track/[token]`, matching how the route is named in
 * the codebase, so tracking traffic is still countable without any single link
 * being reconstructable from analytics.
 */
export default function TrackingAnalytics({ gaId }: { gaId: string }) {
  const id = JSON.stringify(gaId);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
        strategy="afterInteractive"
        // Belt and braces with the route's Referrer-Policy header: the tag
        // request itself must not carry the token in a Referer.
        referrerPolicy="no-referrer"
      />
      <Script id="ga-tracking-page" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', ${id}, {
            page_path: '/track/[token]',
            page_location: window.location.origin + '/track/[token]',
            // The receiver arrives from WhatsApp; neither the sending chat nor
            // our own URL is anyone's business here.
            page_referrer: window.location.origin + '/track/[token]'
          });
        `}
      </Script>
    </>
  );
}
