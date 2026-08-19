import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/i18n';
import { siteUrl } from '@/lib/site';
import { contactEmail, contactPhoneDisplay } from '@/lib/contact';
import LegalPage from '@/components/LegalPage';

type Props = {
  params: Promise<{ locale: string }>;
};

const ogLocales: Record<Locale, string> = { ar: 'ar_EG', en: 'en_US' };

function sectionCount(t: Awaited<ReturnType<typeof getTranslations>>): number {
  let n = 0;
  while (true) {
    const key = `s${n + 1}_title`;
    if (!t.has(key)) return n;
    n += 1;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const title = t('privacy_meta_title');
  const description = t('privacy_meta_description');
  const url = `${siteUrl}/${locale}/privacy`;
  const languages = {
    ar: `${siteUrl}/ar/privacy`,
    en: `${siteUrl}/en/privacy`,
    'x-default': `${siteUrl}/${defaultLocale}/privacy`,
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

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'legal' });
  const count = sectionCount(t);
  const contactVars = { email: contactEmail, phone: contactPhoneDisplay };
  const sections = Array.from({ length: count }, (_, i) => {
    const key = `s${i + 1}_body`;
    const needsContact = key === 's8_body' || key === 's11_body';
    return {
      title: t(`s${i + 1}_title`),
      body: t(key, needsContact ? contactVars : undefined),
    };
  });

  return (
    <LegalPage
      title={t('privacy_title')}
      updated={t('privacy_updated')}
      intro={t('privacy_intro')}
      sections={sections}
    />
  );
}
