import { locales, defaultLocale } from '@/i18n';

const FALLBACK_URL = 'http://localhost:3000';
const PRODUCTION_HOST = 'www.fawran.co';
const APEX_HOST = 'fawran.co';

function normalize(value: string): string {
  const absolute = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return canonicalize(absolute.replace(/\/+$/, ''));
}

function canonicalize(value: string): string {
  const parsed = new URL(value);
  if (parsed.hostname === APEX_HOST || parsed.hostname === PRODUCTION_HOST) {
    parsed.protocol = 'https:';
    parsed.hostname = PRODUCTION_HOST;
    parsed.port = '';
    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';
  }
  return parsed.origin;
}

export function resolveSiteUrl(
  env: NodeJS.Dict<string> = process.env,
): string {
  if (env.NEXT_PUBLIC_SITE_URL) {
    return normalize(env.NEXT_PUBLIC_SITE_URL);
  }

  // Vercel sets this at build time to the project's custom production domain once
  // one is attached, and to the *.vercel.app URL until then. Reading it here means
  // canonicals, hreflang and the sitemap follow the real domain with no code change.
  const vercelDomain =
    env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    env.VERCEL_PROJECT_PRODUCTION_URL;
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

function pathSuffix(path = ''): string {
  if (!path || path === '/') return '';
  return path.startsWith('/') ? path : `/${path}`;
}

export function localizedUrl(locale: string, path = ''): string {
  return `${siteUrl}/${locale}${pathSuffix(path)}`;
}

export function languageAlternates(path = ''): Record<string, string> {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, localizedUrl(locale, path)]),
    ),
    'x-default': localizedUrl(defaultLocale, path),
  };
}
