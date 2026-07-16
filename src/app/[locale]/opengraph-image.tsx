import { ImageResponse } from 'next/og';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Fawran';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// next/og ships Latin glyphs only, so Arabic renders as blank boxes without an
// explicit font. Google's css2 endpoint returns a TTF when the request has no
// browser User-Agent, and `text` subsets it to just the glyphs this image draws.
async function loadGoogleFont(family: string, weight: number, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);

  if (!src) {
    throw new Error(`Could not load ${family} ${weight} for the OG image`);
  }

  return fetch(src[1]).then((res) => res.arrayBuffer());
}

// satori (bundled in @vercel/og 0.7.2) implements no bidi algorithm and ignores
// `direction`. It shapes each Arabic word correctly but positions the words
// left-to-right, so reversing them here restores the intended reading order.
// This only holds for a single line of pure-Arabic text: satori would also wrap
// lines in the wrong direction, and a Latin run would need its own ordering.
// Keep the strings this touches short enough to never wrap.
function toVisualOrder(text: string, isRTL: boolean) {
  return isRTL ? text.split(' ').reverse().join(' ') : text;
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'meta' });

  const isRTL = locale === 'ar';
  const name = t('site_name');
  const tagline = t('og_tagline');
  const location = `${t('city')}${isRTL ? '، ' : ', '}${t('country')}`;

  const family = isRTL ? 'Cairo' : 'Inter';
  const glyphs = `${name}${tagline}${location}`;
  const [bold, regular] = await Promise.all([
    loadGoogleFont(family, 700, glyphs),
    loadGoogleFont(family, 400, glyphs),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: isRTL ? 'flex-end' : 'flex-start',
          backgroundColor: '#0D1020',
          backgroundImage:
            'radial-gradient(circle at 78% 22%, rgba(27,106,255,0.45) 0%, rgba(13,16,32,0) 55%), radial-gradient(circle at 12% 88%, rgba(255,107,26,0.28) 0%, rgba(13,16,32,0) 50%)',
          padding: '80px',
          fontFamily: family,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 104,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: isRTL ? 0 : '-0.03em',
          }}
        >
          {name}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 20,
            fontSize: 46,
            fontWeight: 400,
            color: '#B9C2DB',
            whiteSpace: 'nowrap',
          }}
        >
          {toVisualOrder(tagline, isRTL)}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 24,
            marginTop: 56,
          }}
        >
          <div
            style={{
              width: 88,
              height: 8,
              borderRadius: 999,
              backgroundColor: '#FF6B1A',
            }}
          />
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: '#7C87A6',
              whiteSpace: 'nowrap',
            }}
          >
            {toVisualOrder(location, isRTL)}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: family, data: bold, weight: 700, style: 'normal' },
        { name: family, data: regular, weight: 400, style: 'normal' },
      ],
    },
  );
}
