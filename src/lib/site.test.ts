import { describe, expect, it } from 'vitest';
import {
  languageAlternates,
  localizedUrl,
  resolveSiteUrl,
  siteUrl,
} from './site';

describe('resolveSiteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL', () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: 'https://www.fawran.co',
        VERCEL_PROJECT_PRODUCTION_URL: 'example.vercel.app',
      }),
    ).toBe('https://www.fawran.co');
  });

  it('canonicalizes the apex host to www', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://fawran.co' })).toBe(
      'https://www.fawran.co',
    );
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'fawran.co' })).toBe(
      'https://www.fawran.co',
    );
  });

  it('forces https on the production host', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'http://www.fawran.co' })).toBe(
      'https://www.fawran.co',
    );
  });

  it('strips a trailing slash', () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://www.fawran.co/' }),
    ).toBe('https://www.fawran.co');
  });

  it('leaves preview and local hosts unchanged', () => {
    expect(
      resolveSiteUrl({
        VERCEL_PROJECT_PRODUCTION_URL: 'fawran-landing.vercel.app',
      }),
    ).toBe('https://fawran-landing.vercel.app');
    expect(resolveSiteUrl({})).toBe('http://localhost:3000');
  });
});

describe('localizedUrl', () => {
  it('builds locale homepages without a trailing slash', () => {
    expect(localizedUrl('ar')).toBe(`${siteUrl}/ar`);
    expect(localizedUrl('en', '/')).toBe(`${siteUrl}/en`);
  });

  it('builds nested paths', () => {
    expect(localizedUrl('ar', '/privacy')).toBe(`${siteUrl}/ar/privacy`);
    expect(localizedUrl('en', 'terms')).toBe(`${siteUrl}/en/terms`);
  });
});

describe('languageAlternates', () => {
  it('pairs both locales and points x-default at Arabic', () => {
    expect(languageAlternates()).toEqual({
      ar: `${siteUrl}/ar`,
      en: `${siteUrl}/en`,
      'x-default': `${siteUrl}/ar`,
    });
    expect(languageAlternates('/privacy')).toEqual({
      ar: `${siteUrl}/ar/privacy`,
      en: `${siteUrl}/en/privacy`,
      'x-default': `${siteUrl}/ar/privacy`,
    });
  });
});
