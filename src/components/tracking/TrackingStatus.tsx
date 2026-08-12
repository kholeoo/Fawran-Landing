'use client';

/**
 * The answer to "what is happening to my delivery?", given the most weight of
 * anything on the page after the map itself.
 *
 * Status is never carried by colour alone: every state has its own icon and its
 * own sentence, and the live badge spells out its meaning in words.
 */

import { useTranslations } from 'next-intl';
import {
  Bike,
  CircleCheckBig,
  CircleX,
  Clock,
  Radar,
  UserCheck,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { TRACKING_STATUS, type TrackingStatus as Status } from '@/lib/tracking/contract';
import type { TrackingConnectionState } from '@/lib/tracking/socket';

/** Visual treatment per state. `key` maps onto the `track.status.*` messages. */
const PRESENTATION: Record<
  Status,
  { key: string; Icon: LucideIcon; accent: string; tint: string }
> = {
  [TRACKING_STATUS.SEARCHING]: {
    key: 'searching',
    Icon: Radar,
    accent: '#4A5270',
    tint: '#EEF1F8',
  },
  [TRACKING_STATUS.COURIER_ASSIGNED]: {
    key: 'courier_assigned',
    Icon: UserCheck,
    accent: '#1B6AFF',
    tint: '#EEF3FF',
  },
  [TRACKING_STATUS.IN_TRANSIT]: {
    key: 'in_transit',
    Icon: Bike,
    accent: '#1B6AFF',
    tint: '#EEF3FF',
  },
  [TRACKING_STATUS.DELIVERED]: {
    key: 'delivered',
    Icon: CircleCheckBig,
    accent: '#15A34A',
    tint: '#E9F8EF',
  },
  [TRACKING_STATUS.CANCELLED]: {
    key: 'cancelled',
    Icon: CircleX,
    accent: '#B4232A',
    tint: '#FDECEC',
  },
  [TRACKING_STATUS.EXPIRED]: {
    key: 'expired',
    Icon: Clock,
    accent: '#4A5270',
    tint: '#EEF1F8',
  },
};

type Props = {
  status: Status;
  isLive: boolean;
  connection: TrackingConnectionState;
  /** Live/offline badges only make sense while the delivery is still running. */
  showConnection: boolean;
};

export default function TrackingStatus({ status, isLive, connection, showConnection }: Props) {
  const t = useTranslations('track');
  const { key, Icon, accent, tint } = PRESENTATION[status];

  return (
    <div className="flex items-start gap-4">
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: tint }}
        aria-hidden="true"
      >
        <Icon size={24} style={{ color: accent }} strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        {showConnection && <ConnectionBadge isLive={isLive} connection={connection} />}

        {/* aria-live so a status change reaching the page over the socket is
            announced, not just repainted. */}
        <h1
          className="text-xl font-bold leading-snug text-[#0D1020] sm:text-2xl"
          aria-live="polite"
        >
          {t(`status.${key}_title`)}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[#4A5270]">
          {t(`status.${key}_body`)}
        </p>
      </div>
    </div>
  );
}

/**
 * Says exactly what the connection is doing. "Reconnecting" is reserved for a
 * connection we actually had and lost — the very first attempt says
 * "connecting", because claiming otherwise would be a small lie.
 */
function ConnectionBadge({
  isLive,
  connection,
}: {
  isLive: boolean;
  connection: TrackingConnectionState;
}) {
  const t = useTranslations('track');

  if (isLive) {
    return (
      <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#E9F8EF] px-2.5 py-1 text-[11px] font-semibold text-[#15803D]">
        <span
          className="fawran-live-dot h-1.5 w-1.5 rounded-full bg-[#15A34A]"
          aria-hidden="true"
        />
        <Wifi size={12} aria-hidden="true" />
        {t('live')}
      </span>
    );
  }

  const label =
    connection === 'connecting'
      ? t('connecting')
      : connection === 'reconnecting'
        ? t('reconnecting')
        : t('offline');

  return (
    <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#EEF1F8] px-2.5 py-1 text-[11px] font-semibold text-[#4A5270]">
      <WifiOff size={12} aria-hidden="true" />
      {label}
    </span>
  );
}
