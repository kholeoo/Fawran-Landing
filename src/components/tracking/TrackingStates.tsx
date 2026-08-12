'use client';

/**
 * Loading, invalid-link, and unreachable-backend screens.
 *
 * None of them ever surfaces a backend message, status code, or id: the
 * receiver gets a plain sentence and, where it helps, something to do about it.
 */

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Link2Off, RefreshCw, TriangleAlert } from 'lucide-react';

/** First paint while the initial fetch is in flight — never a blank page. */
export function TrackingLoading() {
  const t = useTranslations('track');

  return (
    <div className="flex flex-1 flex-col" role="status" aria-live="polite">
      <span className="sr-only">{t('loading')}</span>

      <div className="border-b border-[#E2E6F0] bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-start gap-4">
          <span className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-[#EEF1F8]" />
          <div className="flex-1 space-y-2.5 pt-1">
            <span className="block h-4 w-40 animate-pulse rounded-full bg-[#EEF1F8]" />
            <span className="block h-3 w-56 animate-pulse rounded-full bg-[#F1F3F9]" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-[#EEF1F8]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#C8CEDF] border-t-[#1B6AFF]" />
      </div>
    </div>
  );
}

type MessageProps = {
  title: string;
  body: string;
  tone: 'neutral' | 'warning';
  icon: React.ReactNode;
  children?: React.ReactNode;
};

function TrackingMessage({ title, body, tone, icon, children }: MessageProps) {
  const t = useTranslations('track');
  const locale = useLocale();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8 text-center">
        <span
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
            tone === 'warning' ? 'bg-[#FFF4EE] text-[#FF6B1A]' : 'bg-[#EEF1F8] text-[#4A5270]'
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>

        <h1 className="text-lg font-bold leading-snug text-[#0D1020]">{title}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-[#4A5270]">{body}</p>

        <div className="mt-6 flex flex-col items-center gap-3">
          {children}
          <Link
            href={`/${locale}`}
            className="text-sm font-semibold text-[#9BA5BF] transition-colors hover:text-[#1B6AFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B6AFF]"
          >
            {t('home')}
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Bad token, revoked token, or expired link. Deliberately identical for all
 * three: which one it was is not the receiver's business, and telling them
 * would leak whether a token exists.
 */
export function TrackingInvalid() {
  const t = useTranslations('track');

  return (
    <TrackingMessage
      title={t('invalid_title')}
      body={t('invalid_body')}
      tone="neutral"
      icon={<Link2Off size={26} />}
    />
  );
}

/** Backend unreachable. Retryable, and never phrased as "your link is dead". */
export function TrackingError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('track');

  return (
    <TrackingMessage
      title={t('error_title')}
      body={t('error_body')}
      tone="warning"
      icon={<TriangleAlert size={26} />}
    >
      <button
        type="button"
        onClick={onRetry}
        className="glow-blue inline-flex items-center gap-2 rounded-full bg-[#1B6AFF] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1455CC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B6AFF]"
      >
        <RefreshCw size={16} aria-hidden="true" />
        {t('retry')}
      </button>
    </TrackingMessage>
  );
}
