import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
import { languageAlternates, localizedUrl } from '@/lib/site';
import { contactEmail, contactPhoneDisplay } from '@/lib/contact';
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
  const url = localizedUrl(locale, '/support');

  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates('/support') },
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
      intro={t('support_intro', {
        email: contactEmail,
        phone: contactPhoneDisplay,
      })}
      sections={[
        { title: tAbout('title'), body: tAbout('body') },
        {
          title: t('support_area_title'),
          body: t('support_area_body', {
            city: tMeta('city'),
            country: tMeta('country'),
          }),
        },
        {
          title: t('support_how_title'),
          body: t('support_how_body', {
            email: contactEmail,
            phone: contactPhoneDisplay,
          }),
        },
      ]}
      cta={{ href: `/${locale}#contact`, label: t('support_cta') }}
    />
  );
}
