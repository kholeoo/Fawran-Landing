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

// Receiver tracking links are private-by-link: a token in the path is the whole
// authorization story, so an indexed /track/ URL is a public delivery feed. They
// are disallowed for every agent — including the preview scrapers, which lose
// the WhatsApp link card on tracking links only. That is the intended trade:
// the marketing pages still preview, and no crawler is invited to fetch a live
// tracking URL. The route's own noindex metadata and X-Robots-Tag header are the
// real guards; this keeps well-behaved crawlers from requesting them at all.
const TRACKING_PATH = '/track/';

export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return {
      rules: [
        { userAgent: previewBots, allow: '/', disallow: TRACKING_PATH },
        { userAgent: '*', disallow: '/' },
      ],
    };
  }

  return {
    rules: [
      { userAgent: previewBots, allow: '/', disallow: TRACKING_PATH },
      { userAgent: '*', allow: '/', disallow: TRACKING_PATH },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
