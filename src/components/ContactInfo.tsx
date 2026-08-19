'use client';

import { Mail, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  contactEmail,
  contactPhoneDisplay,
  contactPhoneE164,
  socialLinks,
} from '@/lib/contact';

type Props = {
  variant?: 'inline' | 'footer';
};

function SocialIcon({ name }: { name: (typeof socialLinks)[number]['name'] }) {
  const className = 'fill-current';
  switch (name) {
    case 'Facebook':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
        </svg>
      );
    case 'Instagram':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5Zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5ZM17.8 6.2a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2Z" />
        </svg>
      );
    case 'LinkedIn':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
          <path d="M4.98 3.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5ZM3.5 9h3v12h-3V9Zm7 0h2.9v1.6h.04c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7V21h-3v-6.2c0-1.5 0-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21h-3V9Z" />
        </svg>
      );
  }
}

export default function ContactInfo({ variant = 'inline' }: Props) {
  const t = useTranslations('contact');

  const linkClass =
    variant === 'footer'
      ? 'text-[#9BA5BF] hover:text-[#1B6AFF] transition-colors'
      : 'text-[#4A5270] hover:text-[#1B6AFF] transition-colors';

  const iconClass =
    variant === 'footer'
      ? 'text-[#9BA5BF] hover:text-[#1B6AFF] transition-colors'
      : 'text-[#4A5270] hover:text-[#1B6AFF] transition-colors';

  const iconSize = variant === 'footer' ? 'w-[18px] h-[18px]' : 'w-5 h-5';

  return (
    <address
      className={
        variant === 'footer'
          ? 'not-italic mt-4 flex flex-col items-center md:items-start rtl:md:items-end gap-3'
          : 'not-italic flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center'
      }
    >
      <div
        className={
          variant === 'footer'
            ? 'flex flex-col items-center md:items-start rtl:md:items-end gap-2 text-sm'
            : 'flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm'
        }
      >
        <a href={`tel:${contactPhoneE164}`} className={`inline-flex items-center gap-2 ${linkClass}`}>
          <Phone size={16} aria-hidden="true" />
          <span dir="ltr">{contactPhoneDisplay}</span>
        </a>
        <a href={`mailto:${contactEmail}`} className={`inline-flex items-center gap-2 ${linkClass}`}>
          <Mail size={16} aria-hidden="true" />
          <span dir="ltr">{contactEmail}</span>
        </a>
      </div>

      <div
        className={
          variant === 'footer'
            ? 'flex items-center gap-3'
            : 'flex flex-col items-center gap-2 sm:items-start'
        }
      >
        {variant === 'inline' ? (
          <span className="text-[#9BA5BF] text-xs font-medium">{t('follow_us')}</span>
        ) : null}
        <div className="flex items-center gap-3">
          {socialLinks.map(({ name, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="me noopener noreferrer"
              aria-label={name}
              className={`${iconClass} ${iconSize}`}
            >
              <SocialIcon name={name} />
            </a>
          ))}
        </div>
      </div>
    </address>
  );
}
