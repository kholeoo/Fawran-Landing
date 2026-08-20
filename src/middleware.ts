import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n';

const handleI18nRouting = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // Arabic is the site's primary language, so an unprefixed URL should land on
  // /ar regardless of what the browser asks for. Without this, next-intl reads
  // Accept-Language and sends most non-Arabic browsers to /en. This also turns
  // off NEXT_LOCALE cookie detection, so a bare "/" is always /ar; the language
  // switcher links straight to /en paths, which keeps working either way.
  localeDetection: false,
  localeCookie: false,
  // next-intl's default Link header points x-default at the unprefixed URL
  // (/, /privacy, …). Those paths are not pages — they 307 to /ar — and they
  // disagree with the HTML hreflang and sitemap, which correctly use /ar.
  // HTML metadata + sitemap.xml are the source of truth.
  alternateLinks: false,
});

function isDefaultLocalePrefixRedirect(
  request: NextRequest,
  location: string,
): boolean {
  const destination = new URL(location, request.url).pathname;
  const from = request.nextUrl.pathname;
  const prefix = `/${defaultLocale}`;

  if (from === '/') return destination === prefix;
  return destination === `${prefix}${from}`;
}

export default function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);

  // next-intl issues 307 for locale prefixing because it also supports
  // cookie/Accept-Language negotiation. Detection is off, so `/` and other
  // unprefixed paths always become /ar… and a permanent redirect is honest.
  if (response.status === 307) {
    const location = response.headers.get('location');
    if (location && isDefaultLocalePrefixRedirect(request, location)) {
      return NextResponse.redirect(new URL(location, request.url), 308);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
