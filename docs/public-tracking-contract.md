# Public receiver tracking — landing-side notes

**The contract lives in the backend repo:** `docs/public-delivery-tracking-contract.md`
in `fawran-backend`. That document is the source of truth for the endpoint, the
payload, the statuses, and the socket protocol. This file records only what is
decided *here*, plus the handful of things that will bite someone changing this
code later.

## What this repo consumes

| | |
| --- | --- |
| Initial state | `GET {NEXT_PUBLIC_API_URL}/public/tracking/{token}` — once per mount |
| Live updates | socket.io namespace `/public-tracking`, `tracking:subscribe` → `tracking:location` / `tracking:status` |
| Public surface | `status`, `isTrackingActive`, `isFinal`, `location`, `destination`, `fees`, `courier` |
| Statuses | `SEARCHING`, `COURIER_ASSIGNED`, `IN_TRANSIT`, `DELIVERED`, `CANCELLED`, `EXPIRED` |

Both transports are derived from one env var: `NEXT_PUBLIC_API_URL` is the REST
base, and the socket origin is that value with `/api/v1` stripped — the same
convention the mobile app uses in `lib/socket.ts`.

## Decisions this repo made

**Rate limit (30/min per IP).** REST is called exactly once per mount, plus once
per press of the retry button. There is no polling. A reconnect refreshes state
from the `tracking:subscribe` ack rather than re-fetching, as the contract
recommends — the ack is both cheaper and more current.

**Token validation before the network.** A token that is not 8–128 URL-safe
characters, or that looks like a UUID, is rejected client-side and rendered as
the invalid state without a request. The backend 404s these anyway; refusing
locally saves a rate-limited call and keeps a leaked database id out of an
outbound URL. Mirrors mobile's `publicTrackingUrlExposesInternalId`.

**One error message.** 404, a malformed token, and an internal id pasted into
the path all render the same sentence, exactly as uninformative as the backend's
own response. A *transport* failure (429, 5xx, offline) is deliberately
different: it offers a retry and never tells the receiver their link is dead.

**No last-position replay.** The contract says `location` is null whenever
`isTrackingActive` is false, and that there is no replay after a delivery ends.
Two places enforce it independently of the wire: `normalizeTrackingState` drops
`location` when tracking is inactive, and the reducer ignores any
`tracking:location` that arrives after `isFinal`. A network drop is different —
the last fix stays on screen there, greyed, because the delivery is still
running.

**Heading is derived, not received.** The public payload has no bearing, so the
courier marker's facing comes from the step between the previous fix and the
current one, ignoring movements under 8 m as GPS jitter. That is two points held
in memory. No trail is stored and none is drawn — the backend keeps no GPS
history and neither does this page.

**Map RTL plugin always loads.** OSM place names in Suez are Arabic regardless
of UI locale. The MapLibre RTL text plugin is therefore registered on every
tracking page mount — not only when the UI is Arabic. Gating it on
`locale === 'ar'` left English pages rendering reversed labels
("سيوسلا" instead of "السويس").

**Freshness thresholds.** Live under 60s (the contract's suggestion, and ~20
missed fixes at the 3s cadence); the age is shown from 60s; an explicit "may be
out of date" warning appears past 5 minutes. A socket that is down is never
"live", however recent the last fix. All of it keys off the payload's
`updatedAt`, never off the moment the page received the value — a cold load can
be up to 10s behind the stream.

**Fees and courier identity (2026-08-14).** The public GET now also carries
this drop-off's `fees` (رسوم التوصيل) and `courier: { name, mobile } | null`.
The page shows them under the status block and builds a `tel:` link from the
mobile. A payload that omits them still renders the map (`fees`/`courier` →
`null`). Client name/phone stay off the wire.

## Token containment

The token is in the URL path, so it is treated like a password-reset link.

- `noindex, nofollow` in the route's metadata, plus an `X-Robots-Tag` header for
  anything that reads headers but not markup.
- `Disallow: /track/` in `robots.txt` **for every agent**, including the
  link-preview scrapers. Tracking links lose their WhatsApp preview card as a
  result; marketing pages keep theirs. An indexed tracking URL is a public
  delivery feed, and that trade is not close.
- `Referrer-Policy: no-referrer` on `/track/*` (both the locale-prefixed and
  bare forms, since the backend hands out unprefixed links), so the token cannot
  ride along in a `Referer` to map tiles or anywhere else. The Google Maps
  link and the REST call set `referrerPolicy: 'no-referrer'` themselves too.
- GA4 on this route is configured by hand (`TrackingAnalytics`) rather than by
  `@next/third-parties`, whose bare `gtag('config', id)` would report
  `document.location.href` — token included. The route is reported as the
  literal `/track/[token]`. Events carry locale and status only.
- No cookies, no localStorage, no auth. The token is read from the route params
  and held in memory.
- The receiver is never asked for their location. There is no product reason to
  prompt, and the prompt itself makes the page look untrustworthy.

## Routing

The backend builds links from `PUBLIC_TRACKING_BASE_URL`
(default `https://fawran.app/track`), so shared links have **no locale prefix**.
`next-intl` middleware redirects `/track/{token}` to `/{locale}/track/{token}`
using the receiver's `Accept-Language`, defaulting to Arabic. If this route ever
moves, tell the backend rather than rewriting at the edge — it owns the link.

## Before launch (not doable from this repo)

- **Add the landing origins to the API's `ALLOWED_ORIGINS`** — production and,
  if previews should work, the preview domains. Until then the browser blocks
  the REST call. The WebSocket is unaffected, so the symptom is a page that
  shows the retry error while live updates would have worked.
- Set `NEXT_PUBLIC_MAPTILER_KEY` in production so tiles are served under our own
  quota instead of the keyless OpenFreeMap fallback.
- Both transports must be HTTPS/WSS in production.

## Development without a live delivery

`NEXT_PUBLIC_TRACKING_MOCK=1` serves a scripted run from
`src/lib/tracking/mock.ts`. It is gated on `NODE_ENV !== 'production'` as well as
the flag, so a production build ignores the variable entirely. Deleting that
file and its two call sites removes mocking completely.
