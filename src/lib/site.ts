const FALLBACK_URL = 'http://localhost:3000';

function normalize(value: string): string {
  const absolute = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return absolute.replace(/\/+$/, '');
}

function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalize(process.env.NEXT_PUBLIC_SITE_URL);
  }

  // Vercel sets this at build time to the project's custom production domain once
  // one is attached, and to the *.vercel.app URL until then. Reading it here means
  // canonicals, hreflang and the sitemap follow the real domain with no code change.
  const vercelDomain =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelDomain) {
    return normalize(vercelDomain);
  }

  return FALLBACK_URL;
}

export const siteUrl = resolveSiteUrl();

const { hostname } = new URL(siteUrl);

// Keep the site out of the index until it lives on its real domain: indexing the
// placeholder *.vercel.app URL would split ranking signals across two hostnames and
// leave redirects to clean up after the migration. Preview deploys never index.
export const isIndexable =
  process.env.VERCEL_ENV !== 'preview' &&
  hostname !== 'localhost' &&
  !hostname.endsWith('.vercel.app');
