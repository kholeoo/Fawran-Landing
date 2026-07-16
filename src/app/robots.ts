import type { MetadataRoute } from 'next';
import { siteUrl, isIndexable } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
