'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import FawranWordmark from './FawranWordmark';
import ContactInfo from './ContactInfo';

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const year = new Date().getFullYear();

  const home = `/${locale}`;
  const links = [
    { label: tNav('about'), href: `${home}#about` },
    { label: tNav('features'), href: `${home}#features` },
    { label: tNav('faq'), href: `${home}#faq` },
    { label: tNav('contact'), href: `${home}#contact` },
    { label: tNav('download'), href: `${home}#download` },
  ];
  const legalLinks = [
    { label: tNav('privacy'), href: `${home}/privacy` },
    { label: tNav('terms'), href: `${home}/terms` },
    { label: tNav('support'), href: `${home}/support` },
    { label: tNav('sitemap'), href: `${home}/sitemap` },
  ];

  const isRTL = locale === 'ar';
  const brandAlign = isRTL
    ? 'items-center md:items-end md:me-auto'
    : 'items-center md:items-start';
  const brandTextAlign = isRTL ? 'text-center md:text-end' : 'text-center md:text-start';

  return (
    <footer className="border-t border-[#E2E6F0] bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className={`flex flex-col gap-4 ${brandAlign}`}>
            <div className={`inline-flex flex-col ${brandAlign}`}>
              <Link href={`/${locale}`} className="inline-block">
                <FawranWordmark variant="colored" width={110} />
              </Link>
              <p className={`text-[#9BA5BF] text-sm mt-1 ${brandTextAlign}`}>
                {t('tagline')}
              </p>
            </div>
            <ContactInfo variant="footer" align={isRTL ? 'end' : 'start'} />
          </div>

          <nav
            className={`flex flex-wrap justify-center gap-6 ${isRTL ? 'md:justify-start' : 'md:justify-end'}`}
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[#9BA5BF] hover:text-[#1B6AFF] text-sm transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <nav
          className={`mt-6 flex flex-wrap justify-center gap-6 ${isRTL ? 'md:justify-start' : 'md:justify-end'}`}
        >
          {legalLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[#9BA5BF] hover:text-[#1B6AFF] text-sm transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 pt-6 border-t border-[#E2E6F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#9BA5BF] text-xs">
          <span>{t('made_in')}</span>
          <span>© {year} فوراً · {t('rights')}</span>
        </div>
      </div>
    </footer>
  );
}
