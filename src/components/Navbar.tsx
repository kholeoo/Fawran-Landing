'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import FawranWordmark from './FawranWordmark';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { key: 'about', label: t('about'), href: '#about' },
    { key: 'features', label: t('features'), href: '#features' },
    { key: 'contact', label: t('contact'), href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-[#E2E6F0] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center">
          <FawranWordmark variant="colored" width={120} />
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.key}>
              <a
                href={link.href}
                className="text-[#4A5270] hover:text-[#1B6AFF] transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href={`/${otherLocale}`}
            className="hidden md:flex text-xs font-semibold px-3 py-1.5 rounded-full border border-[#E2E6F0] text-[#4A5270] hover:border-[#1B6AFF] hover:text-[#1B6AFF] transition-all"
          >
            {locale === 'ar' ? 'EN' : 'AR'}
          </Link>

          <a
            href="#download"
            className="hidden md:flex items-center px-4 py-2 rounded-full bg-[#1B6AFF] text-white text-sm font-semibold hover:bg-[#1455CC] transition-all glow-blue"
          >
            {t('download')}
          </a>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-[#4A5270] hover:text-[#0D1020]"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-[#E2E6F0] bg-white shadow-lg"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-[#4A5270] hover:text-[#1B6AFF] py-2 text-base font-medium"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <Link
                  href={`/${otherLocale}`}
                  className="px-4 py-2 rounded-full border border-[#E2E6F0] text-[#4A5270] text-sm"
                >
                  {locale === 'ar' ? 'English' : 'العربية'}
                </Link>
                <a
                  href="#download"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-full bg-[#1B6AFF] text-white text-sm font-semibold"
                >
                  {t('download')}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
