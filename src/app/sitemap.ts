import type { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}`])),
    'x-default': `${siteUrl}/${defaultLocale}`,
  };

  return locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: locale === defaultLocale ? 1 : 0.8,
    alternates: { languages },
  }));
}
