import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  async redirects() {
    return [
      { source: '/privacy', destination: '/ar/privacy', permanent: true },
      { source: '/privacy-policy', destination: '/ar/privacy', permanent: true },
      { source: '/terms', destination: '/ar/terms', permanent: true },
      { source: '/support', destination: '/ar/support', permanent: true },
      { source: '/legal', destination: '/ar/privacy', permanent: true },
      // Play's Data Safety form takes a single URL, and reviewers paste it
      // unprefixed. Both spellings land on the Arabic page.
      { source: '/delete-account', destination: '/ar/delete-account', permanent: true },
      { source: '/delete_account', destination: '/ar/delete-account', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        // Receiver tracking links carry their authorization in the path, which
        // makes normally-boring headers matter: without this, the token rides
        // along in the Referer of every outbound request the page makes — map
        // tiles above all. `X-Robots-Tag` doubles up on the route's own
        // noindex metadata for anything that reads headers but not markup.
        source: '/:locale/track/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        // Same guarantee before the locale redirect has happened, since the
        // backend hands out unprefixed /track/{token} links.
        source: '/track/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
