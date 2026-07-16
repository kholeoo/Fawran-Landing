import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/i18n';
import { siteUrl, isIndexable } from '@/lib/site';
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

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name,
        url: siteUrl,
        logo: `${siteUrl}/wordmark-colored.png`,
        description,
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
        // A courier service has no premises to visit, so it is described as a
        // service-area business: areaServed rather than a street address.
        '@type': 'DeliveryService',
        '@id': `${url}#service`,
        name,
        description,
        url,
        provider: { '@id': `${siteUrl}/#organization` },
        areaServed: {
          '@type': 'City',
          name: t('city'),
          containedInPlace: {
            '@type': 'AdministrativeArea',
            name: t('region'),
            containedInPlace: { '@type': 'Country', name: t('country') },
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 29.9668,
            longitude: 32.5498,
          },
        },
      },
      {
        '@type': 'MobileApplication',
        '@id': `${url}#app`,
        name,
        url,
        operatingSystem: 'Android',
        applicationCategory: 'DeliveryApplication',
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
