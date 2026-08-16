// Off-site profiles that belong to this Fawran. These exist for one reason:
// "Fawran"/"فورًا" is not a unique name — an unrelated Saudi domestic-staffing
// app ranks for it — so Google needs help deciding which entity this site is.
// The `sameAs` list is the strongest signal available for that: it ties the
// domain to store listings and social profiles that already carry the right
// category and country, and consolidates them into one entity.
//
// Env-gated like every other integration here: unset values simply drop out, so
// the JSON-LD never claims a profile that does not exist yet.
const profileUrls = [
  process.env.NEXT_PUBLIC_PLAY_STORE_URL,
  process.env.NEXT_PUBLIC_APP_STORE_URL,
  process.env.NEXT_PUBLIC_FACEBOOK_URL,
  process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  process.env.NEXT_PUBLIC_LINKEDIN_URL,
];

export const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL;
export const appStoreUrl = process.env.NEXT_PUBLIC_APP_STORE_URL;

export const sameAs = profileUrls.filter((url): url is string => Boolean(url));

// Every written form of the name a person might search for, so the entity
// matches whichever spelling they type.
//
// The brand is `فوراً` — alef first, then the tanween. The near-identical
// `فورًا` orders those two marks the other way; it renders almost the same but
// is a different byte sequence, and it is the ordinary adverb "immediately"
// rather than the name. Both belong here, because searchers type both, but only
// `فوراً` may be used as the name itself — see meta.site_name. Never judge these
// two by eye; compare the bytes.
export const alternateNames = [
  'Fawran',
  'Fawran Delivery',
  'فوراً',
  'فوراً للتوصيل',
  'فورًا',
  'فورا',
];
