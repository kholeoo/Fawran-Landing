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

  const links = [
    { label: tNav('about'), href: '#about' },
    { label: tNav('features'), href: '#features' },
    { label: tNav('contact'), href: '#contact' },
    { label: tNav('download'), href: '#download' },
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

        <div className="mt-10 pt-6 border-t border-[#E2E6F0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[#9BA5BF] text-xs">
          <span>{t('made_in')}</span>
          <span>© {year} فورًا · {t('rights')}</span>
        </div>
      </div>
    </footer>
  );
}
