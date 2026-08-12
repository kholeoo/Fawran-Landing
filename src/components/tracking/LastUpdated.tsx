'use client';

/**
 * Freshness, stated honestly. The page would rather admit it has an old
 * position than imply a stale marker is live.
 */

import { useTranslations } from 'next-intl';
import { TriangleAlert } from 'lucide-react';
import { getFreshness } from '@/lib/tracking/freshness';

type Props = {
  lastUpdatedAt: string | null;
  /** Ticking clock owned by the parent, so the whole page shares one timer. */
  now: number;
  isConnected: boolean;
};

export default function LastUpdated({ lastUpdatedAt, now, isConnected }: Props) {
  const t = useTranslations('track');
  const { level, count, unit } = getFreshness(lastUpdatedAt, now, isConnected);

  const label =
    unit === null || count === null
      ? t('last_updated_unknown')
      : t(`last_updated_${unit}`, { count });

  return (
    <div className="flex flex-col gap-1.5">
      <p
        className={`text-xs font-medium ${
          level === 'very_stale' ? 'text-[#4A5270]' : 'text-[#9BA5BF]'
        }`}
        // Not assertive: this changes every second and must not interrupt.
        aria-live="off"
      >
        {label}
      </p>

      {level === 'very_stale' && (
        <p
          role="status"
          className="inline-flex items-start gap-1.5 text-xs font-medium text-[#B4560A]"
        >
          <TriangleAlert size={14} className="mt-px shrink-0" aria-hidden="true" />
          <span>{t('stale_warning')}</span>
        </p>
      )}
    </div>
  );
}
