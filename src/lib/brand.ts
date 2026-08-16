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
// matches whichever spelling they type. Arabic writes the tanween on the alef
// two ways (فورًا / فوراً) and often drops it entirely (فورا); each is a
// distinct string to a search engine.
export const alternateNames = [
  'Fawran',
  'فورًا',
  'فوراً',
  'فورا',
  'Fawran Delivery',
  'فورًا للتوصيل',
];
