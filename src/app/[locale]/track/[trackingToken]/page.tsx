import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
import TrackingExperience from '@/components/tracking/TrackingExperience';

type Props = {
  params: Promise<{ locale: string; trackingToken: string }>;
};

/**
 * Private-by-link, so it is `noindex, nofollow` unconditionally — unlike the
 * marketing pages, which only hide themselves while the site is on its
 * placeholder domain.
 *
 * Nothing here interpolates the token: no title, no canonical, no Open Graph
 * URL. A tracking link must not be reconstructable from page metadata, and
 * scrapers that fetch the URL should learn nothing from the head.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'track' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
    // No canonical and no hreflang: both would publish a live tracking URL.
    alternates: {},
    openGraph: { title: t('meta_title'), description: t('meta_description') },
    twitter: { card: 'summary', title: t('meta_title') },
  };
}

export default async function TrackPage({ params }: Props) {
  const { locale, trackingToken } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  // The token is handed straight to the client shell. It is never resolved on
  // the server: the public tracking API is called from the browser, so a shared
  // link renders the same for everyone and no token reaches our server logs.
  return <TrackingExperience token={trackingToken} />;
}
