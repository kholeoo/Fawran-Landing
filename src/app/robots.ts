import type { MetadataRoute } from 'next';
import { siteUrl, isIndexable } from '@/lib/site';

// Link-preview scrapers for the major messaging/social platforms. These are
// allowed through even while the site is hidden from search, so shared links
// still render a rich card on the placeholder domain. They do not feed any
// search index, and the pages' noindex meta remains the real guard against
// being indexed.
const previewBots = [
  'facebookexternalhit', // Facebook + WhatsApp
  'Facebot',
  'WhatsApp',
  'Twitterbot',
  'LinkedInBot',
  'TelegramBot',
  'Slackbot-LinkExpanding',
  'Discordbot',
];

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return {
      rules: [
        { userAgent: previewBots, allow: '/' },
        { userAgent: '*', disallow: '/' },
      ],
    };
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
