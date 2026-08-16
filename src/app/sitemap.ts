import type { MetadataRoute } from 'next';
import { locales, defaultLocale } from '@/i18n';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/privacy', '/terms', '/support'];

  return locales.flatMap((locale) =>
    pages.map((page) => ({
      url: `${siteUrl}/${locale}${page}`,
      lastModified: new Date(),
      // No assertion needed: MetadataRoute.Sitemap gives both branches their
      // contextual literal type.
      changeFrequency: page === '' ? 'monthly' : 'yearly',
      priority: page === '' ? (locale === defaultLocale ? 1 : 0.8) : 0.5,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((item) => [item, `${siteUrl}/${item}${page}`]),
          ),
          'x-default': `${siteUrl}/${defaultLocale}${page}`,
        },
      },
    })),
  );
}
