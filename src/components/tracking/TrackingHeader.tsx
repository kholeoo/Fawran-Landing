'use client';

/**
 * Deliberately not the marketing navbar: brand plus a language switch, nothing
 * that competes with "where is my delivery?".
 */

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useParams } from 'next/navigation';
import FawranWordmark from '@/components/FawranWordmark';

export default function TrackingHeader() {
  const locale = useLocale();
  const params = useParams<{ trackingToken?: string | string[] }>();
  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  // Switch language in place rather than dropping the receiver on the homepage.
  // Read from route params, not the pathname, so the token is never re-parsed
  // out of a string that may have been rewritten.
  const rawToken = params?.trackingToken;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  const switchHref = token
    ? `/${otherLocale}/track/${encodeURIComponent(token)}`
    : `/${otherLocale}`;

  return (
    <header className="shrink-0 border-b border-[#E2E6F0] bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center" aria-label="فوراً Fawran">
          <FawranWordmark variant="colored" width={104} />
        </Link>

        <Link
          href={switchHref}
          hrefLang={otherLocale}
          className="rounded-full border border-[#E2E6F0] px-3 py-1.5 text-xs font-semibold text-[#4A5270] transition-colors hover:border-[#1B6AFF] hover:text-[#1B6AFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B6AFF]"
        >
          {locale === 'ar' ? 'EN' : 'AR'}
        </Link>
      </div>
    </header>
  );
}
