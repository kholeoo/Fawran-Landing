import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/i18n';
import { siteUrl } from '@/lib/site';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// The human-readable counterpart to /sitemap.xml. The XML file is what crawlers
// actually consume — they find it through robots.txt and Search Console, never
// through a link on the page — so this exists for readers, and for the handful
// of extra internal links it gives every page and both locales.
//
// Note the route does not collide with the generated /sitemap.xml: that is a
// root-level file route, and the middleware matcher skips any path containing a
// dot, so only this locale-prefixed page is rewritten.

type Props = {
  params: Promise<{ locale: string }>;
};

const ogLocales: Record<Locale, string> = { ar: 'ar_EG', en: 'en_US' };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'sitemap' });
  const title = t('meta_title');
  const description = t('meta_description');
  const url = `${siteUrl}/${locale}/sitemap`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ar: `${siteUrl}/ar/sitemap`,
        en: `${siteUrl}/en/sitemap`,
        'x-default': `${siteUrl}/${defaultLocale}/sitemap`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      locale: ogLocales[locale as Locale],
      type: 'website',
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function LinkList({ items }: { items: { label: string; href: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="text-[#1B6AFF] hover:underline underline-offset-4"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function SitemapPage({ params }: Props) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations('sitemap');
  const tNav = await getTranslations('nav');
  const tHow = await getTranslations('how');
  const home = `/${locale}`;

  const pages = [
    { label: t('home'), href: home },
    { label: tNav('privacy'), href: `${home}/privacy` },
    { label: tNav('terms'), href: `${home}/terms` },
    { label: tNav('support'), href: `${home}/support` },
    { label: tNav('sitemap'), href: `${home}/sitemap` },
  ];

  const sections = [
    { label: tHow('title'), href: `${home}#how` },
    { label: tNav('features'), href: `${home}#features` },
    { label: tNav('about'), href: `${home}#about` },
    { label: tNav('faq'), href: `${home}#faq` },
    { label: tNav('download'), href: `${home}#download` },
    { label: tNav('contact'), href: `${home}#contact` },
  ];

  // Labelled in their own language rather than the current one, which is the
  // convention a language list is actually read by.
  const languages = [
    { label: 'العربية', href: '/ar' },
    { label: 'English', href: '/en' },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0D1020]">
            {t('title')}
          </h1>
          <p className="text-[#4A5270] mt-3">{t('intro')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mt-12">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9BA5BF] mb-4">
                {t('pages')}
              </h2>
              <LinkList items={pages} />
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9BA5BF] mb-4">
                {t('sections')}
              </h2>
              <LinkList items={sections} />
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9BA5BF] mb-4">
                {t('languages')}
              </h2>
              <LinkList items={languages} />
            </section>
          </div>

          <section className="mt-16 pt-8 border-t border-[#E2E6F0]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9BA5BF] mb-3">
              {t('xml_title')}
            </h2>
            <p className="text-[#4A5270] text-sm">
              {t('xml_body')}{' '}
              <a
                href="/sitemap.xml"
                className="text-[#1B6AFF] hover:underline underline-offset-4"
              >
                /sitemap.xml
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
