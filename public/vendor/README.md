# Vendored browser assets

## mapbox-gl-rtl-text.js

`@mapbox/mapbox-gl-rtl-text@0.4.0`, copied verbatim from the package's
`dist/mapbox-gl-rtl-text.js`. BSD-3-Clause — see
`mapbox-gl-rtl-text.LICENSE.md`.

MapLibre cannot shape Arabic map labels without it: place names render as
unjoined, left-to-right glyphs. It is served from our own origin rather than a
CDN so the tracking map has no third-party script dependency. It is registered
lazily on every tracking page mount (`TrackingMap.tsx`) — OSM labels in Suez
are Arabic regardless of UI locale, so English pages need it too.

To update, `npm pack @mapbox/mapbox-gl-rtl-text@<version>` and copy `dist/` and
`LICENSE.md` out of the tarball.
