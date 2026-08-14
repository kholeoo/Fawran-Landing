'use client';

/**
 * What the receiver needs besides the map: this drop-off's fee, and who to
 * call. Hidden while the payload has neither.
 */

import { useTranslations } from 'next-intl';
import { Phone } from 'lucide-react';
import { toTelHref } from '@/lib/tracking/phone';
import type { TrackingCourier } from '@/lib/tracking/contract';

type Props = {
  fees: number | null;
  courier: TrackingCourier | null;
};

export default function TrackingReceiverDetails({ fees, courier }: Props) {
  const t = useTranslations('track');
  const telHref = courier ? toTelHref(courier.mobile) : null;

  if (fees == null && !courier) return null;

  return (
    <dl className="mt-5 overflow-hidden rounded-2xl border border-[#E2E6F0] bg-[#F8F9FC]">
      {fees != null && (
        <div className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-widest text-[#9BA5BF]">
            {t('fees_label')}
          </dt>
          <dd className="text-sm font-bold text-[#0D1020]">{t('fees_value', { amount: fees })}</dd>
        </div>
      )}

      {courier && (
        <div
          className={`flex items-center justify-between gap-4 px-4 py-3 ${
            fees != null ? 'border-t border-[#E2E6F0]' : ''
          }`}
        >
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-widest text-[#9BA5BF]">
              {t('courier_label')}
            </dt>
            <dd className="mt-0.5 truncate text-sm font-bold text-[#0D1020]">{courier.name}</dd>
            <p className="mt-0.5 truncate text-xs text-[#4A5270]" dir="ltr">
              {courier.mobile}
            </p>
          </div>

          {telHref && (
            <a
              href={telHref}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1B6AFF] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B6AFF]"
            >
              <Phone size={14} aria-hidden="true" />
              {t('call')}
            </a>
          )}
        </div>
      )}
    </dl>
  );
}
