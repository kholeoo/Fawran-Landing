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

function sectionCount(t: Awaited<ReturnType<typeof getTranslations>>): number {
  let n = 0;
  while (true) {
    const key = `t${n + 1}_title`;
    if (!t.has(key)) return n;
    n += 1;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const title = t('terms_meta_title');
  const description = t('terms_meta_description');
  const url = `${siteUrl}/${locale}/terms`;
  const languages = {
    ar: `${siteUrl}/ar/terms`,
    en: `${siteUrl}/en/terms`,
    'x-default': `${siteUrl}/${defaultLocale}/terms`,
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

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'legal' });
  const count = sectionCount(t);
  const sections = Array.from({ length: count }, (_, i) => ({
    title: t(`t${i + 1}_title`),
    body: t(`t${i + 1}_body`),
  }));

  return (
    <LegalPage
      title={t('terms_title')}
      updated={t('terms_updated')}
      intro={t('terms_intro')}
      sections={sections}
    />
  );
}
