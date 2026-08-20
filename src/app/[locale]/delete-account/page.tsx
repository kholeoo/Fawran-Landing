import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n';
import { languageAlternates, localizedUrl } from '@/lib/site';
import { contactEmail } from '@/lib/contact';
import LegalPage from '@/components/LegalPage';

type Props = {
  params: Promise<{ locale: string }>;
};

const ogLocales: Record<Locale, string> = { ar: 'ar_EG', en: 'en_US' };

/**
 * Sections are `d{n}_title` / `d{n}_body`, matching how privacy uses `s{n}_`
 * and terms uses `t{n}_` inside the same `legal` namespace.
 */
function sectionCount(t: Awaited<ReturnType<typeof getTranslations>>): number {
  let n = 0;
  while (true) {
    const key = `d${n + 1}_title`;
    if (!t.has(key)) return n;
    n += 1;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });
  const title = t('delete_meta_title');
  const description = t('delete_meta_description');
  const url = localizedUrl(locale, '/delete-account');

  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates('/delete-account') },
    openGraph: {
      title,
      description,
      url,
      locale: ogLocales[locale as Locale],
      type: 'website',
    },
  };
}

export default async function DeleteAccountPage({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'legal' });
  const count = sectionCount(t);
  const sections = Array.from({ length: count }, (_, i) => ({
    title: t(`d${i + 1}_title`),
    body: t(`d${i + 1}_body`, { email: contactEmail }),
  }));

  return (
    <LegalPage
      title={t('delete_title')}
      updated={t('delete_updated')}
      intro={t('delete_intro')}
      sections={sections}
      cta={{
        href: `mailto:${contactEmail}?subject=${encodeURIComponent(
          t('delete_cta_subject'),
        )}`,
        label: t('delete_cta'),
      }}
      footerNote={t('delete_footer_note', { email: contactEmail })}
    />
  );
}
