import type { Metadata } from 'next';
import { Cairo, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
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

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'ar') {
    return {
      title: 'فورًا | توصيل سريع وموثوق في السويس',
      description: 'فورًا منصة توصيل ذكية تربط العملاء بالمناديب في السويس، مصر.',
      alternates: {
        canonical: 'https://fawran.app/ar',
        languages: { ar: 'https://fawran.app/ar', en: 'https://fawran.app/en' },
      },
      openGraph: {
        title: 'فورًا | توصيل سريع وموثوق في السويس',
        description: 'فورًا منصة توصيل ذكية تربط العملاء بالمناديب في السويس، مصر.',
        locale: 'ar_EG',
        type: 'website',
        url: 'https://fawran.app/ar',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'فورًا | توصيل سريع وموثوق في السويس',
        description: 'فورًا منصة توصيل ذكية تربط العملاء بالمناديب في السويس، مصر.',
      },
      robots: { index: true, follow: true },
      icons: { icon: '/favicon.png', apple: '/favicon.png' },
    };
  }

  return {
    title: 'Fawran | Fast & Reliable Delivery in Suez, Egypt',
    description: 'Fawran is a smart delivery platform connecting clients with couriers in Suez, Egypt.',
    alternates: {
      canonical: 'https://fawran.app/en',
      languages: { ar: 'https://fawran.app/ar', en: 'https://fawran.app/en' },
    },
    openGraph: {
      title: 'Fawran | Fast & Reliable Delivery in Suez, Egypt',
      description: 'Fawran is a smart delivery platform connecting clients with couriers in Suez, Egypt.',
      locale: 'en_US',
      type: 'website',
      url: 'https://fawran.app/en',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Fawran | Fast & Reliable Delivery in Suez, Egypt',
      description: 'Fawran is a smart delivery platform connecting clients with couriers in Suez, Egypt.',
    },
    robots: { index: true, follow: true },
    icons: { icon: '/favicon.png', apple: '/favicon.png' },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Fawran',
      url: 'https://fawran.app',
      description: 'On-demand delivery platform in Suez, Egypt',
      foundingLocation: { '@type': 'Place', name: 'Suez, Egypt' },
    },
    {
      '@type': 'MobileApplication',
      name: 'Fawran',
      operatingSystem: 'Android',
      applicationCategory: 'DeliveryApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EGP' },
    },
  ],
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
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
      </body>
    </html>
  );
}
