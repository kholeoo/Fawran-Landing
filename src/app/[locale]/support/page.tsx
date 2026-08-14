import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/i18n';
import { siteUrl } from '@/lib/site';
import LegalPage from '@/components/LegalPage';

type Props = {
  params: Promise<{ locale: string }>;
};

const ogLocales: Record<Locale, string> = { ar: 'ar_EG', en: 'en_US' };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const title = t('support_meta_title');
  const description = t('support_meta_description');
  const url = `${siteUrl}/${locale}/support`;
  const languages = {
    ar: `${siteUrl}/ar/support`,
    en: `${siteUrl}/en/support`,
    'x-default': `${siteUrl}/${defaultLocale}/support`,
  };

  return {
    title,
    description,
    alternates: { canonical: url, languages },
    openGraph: {
      title,
      description,
      url,
      locale: ogLocales[locale as Locale],
      type: 'website',
    },
  };
}

export default async function SupportPage({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'legal' });
  const tAbout = await getTranslations({ locale, namespace: 'about' });
  const tMeta = await getTranslations({ locale, namespace: 'meta' });

  return (
    <LegalPage
      title={t('support_title')}
      intro={t('support_intro')}
      sections={[
        { title: tAbout('title'), body: tAbout('body') },
        {
          title: t('support_area_title'),
          body: t('support_area_body', {
            city: tMeta('city'),
            country: tMeta('country'),
          }),
        },
        { title: t('support_how_title'), body: t('support_how_body') },
      ]}
      cta={{ href: `/${locale}#contact`, label: t('support_cta') }}
    />
  );
}
