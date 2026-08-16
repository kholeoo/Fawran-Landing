'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import FawranWordmark from './FawranWordmark';

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

  return (
    <footer className="border-t border-[#E2E6F0] bg-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-start rtl:md:text-end">
            <Link href={`/${locale}`}>
              <FawranWordmark variant="colored" width={110} />
            </Link>
            <p className="text-[#9BA5BF] text-sm mt-1">{t('tagline')}</p>
          </div>

          <nav className="flex flex-wrap justify-center gap-6">
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

        <nav className="mt-6 flex flex-wrap justify-center md:justify-end gap-6">
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
          <span>© {year} فورًا · {t('rights')}</span>
        </div>
      </div>
    </footer>
  );
}
