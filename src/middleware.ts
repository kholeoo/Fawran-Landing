import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Arabic is the site's primary language, so an unprefixed URL should land on
  // /ar regardless of what the browser asks for. Without this, next-intl reads
  // Accept-Language and sends most non-Arabic browsers to /en. This also turns
  // off NEXT_LOCALE cookie detection, so a bare "/" is always /ar; the language
  // switcher links straight to /en paths, which keeps working either way.
  localeDetection: false,
});

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
