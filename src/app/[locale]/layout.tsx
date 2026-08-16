import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/i18n';
import { siteUrl, isIndexable } from '@/lib/site';
import { alternateNames, sameAs, playStoreUrl } from '@/lib/brand';
import Analytics from '@/components/Analytics';
import '../globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const ogLocales: Record<Locale, string> = { ar: 'ar_EG', en: 'en_US' };

const languageAlternates = {
  ...Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}`])),
  'x-default': `${siteUrl}/${defaultLocale}`,
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  const title = t('title');
  const description = t('description');
  const url = `${siteUrl}/${locale}`;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates },
    openGraph: {
      title,
      description,
      url,
      siteName: t('site_name'),
      locale: ogLocales[locale as Locale],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: isIndexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    icons: { icon: '/favicon.png', apple: '/favicon.png' },
    // Dormant until the Search Console token is set — emits the verification
    // meta tag only once GOOGLE_SITE_VERIFICATION is provided (real domain).
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function buildJsonLd(locale: string) {
  const t = await getTranslations({ locale, namespace: 'meta' });

  const name = t('site_name');
  const description = t('description');
  const url = `${siteUrl}/${locale}`;

  // A courier service has no premises to visit, so the area it covers is
  // described as a service area rather than a street address. Reused by both the
  // Organization and the DeliveryService node: several unrelated products share
  // this brand name — a Qatari payment service above all — and the country is
  // the cheapest signal that tells them apart.
  //
  // Deliberately an array of one rather than a bare object: launching a second
  // city is then an added entry here and its two translated strings, with no
  // change to the shape consumers read. Only list cities actually served —
  // claiming national coverage before it exists sends visitors to a city we
  // cannot deliver in, and the bounce costs more than the extra reach earns.
  const areaServed = [
    {
      '@type': 'City',
      name: t('city'),
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: t('region'),
        // The chain up to Country is what scopes the whole entity to Egypt, so
        // it keeps working unchanged as cities are added.
        containedInPlace: { '@type': 'Country', name: t('country') },
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 29.9668,
        longitude: 32.5498,
      },
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name,
        // Both Arabic spellings plus the Latin transliteration, so the entity
        // matches whichever form someone searches for.
        alternateName: alternateNames,
        url: siteUrl,
        logo: `${siteUrl}/wordmark-colored.png`,
        description,
        areaServed,
        ...(sameAs.length > 0 && { sameAs }),
      },
      {
        // Organization is one entity shared by both locales, so its @id stays
        // global; the nodes below differ per locale and get locale-scoped ids.
        '@type': 'WebSite',
        '@id': `${url}#website`,
        url,
        name,
        inLanguage: locale,
        publisher: { '@id': `${siteUrl}/#organization` },
      },
      {
        '@type': 'DeliveryService',
        '@id': `${url}#service`,
        name,
        alternateName: alternateNames,
        description,
        url,
        provider: { '@id': `${siteUrl}/#organization` },
        areaServed,
        // A floor price rather than a fixed one: the fee is distance-based, so
        // minPrice is the only honest figure to publish. Keep this in step with
        // the FAQ answer, which quotes the same number.
        offers: {
          '@type': 'Offer',
          priceSpecification: {
            '@type': 'PriceSpecification',
            minPrice: 30,
            priceCurrency: 'EGP',
          },
        },
        // Ordering is open around the clock. This describes the service's
        // availability, not a guarantee that a courier is always free — the
        // tracking page has an EXPIRED state for when none is found in time.
        hoursAvailable: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          opens: '00:00',
          closes: '23:59',
        },
      },
      {
        '@type': 'MobileApplication',
        '@id': `${url}#app`,
        name,
        description,
        url,
        operatingSystem: 'Android, iOS',
        // schema.org has no delivery-specific category, and an invented value
        // matches nothing. BusinessApplication is the closest recognised term;
        // the DeliveryService node above carries the actual category signal.
        applicationCategory: 'BusinessApplication',
        inLanguage: locale,
        publisher: { '@id': `${siteUrl}/#organization` },
        ...(playStoreUrl && { installUrl: playStoreUrl, downloadUrl: playStoreUrl }),
        ...(sameAs.length > 0 && { sameAs }),
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EGP' },
      },
    ],
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Without this, reading the locale falls back to the incoming request headers,
  // which opts every page into dynamic rendering despite generateStaticParams.
  setRequestLocale(locale);

  const messages = await getMessages();
  const jsonLd = await buildJsonLd(locale);
  const isRTL = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`${cairo.variable} ${inter.variable} scroll-smooth`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#F8F9FC] text-[#0D1020] antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
