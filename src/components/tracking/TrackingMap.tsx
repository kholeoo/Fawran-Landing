'use client';

/**
 * The live map. Created exactly once and then mutated — a new courier position
 * moves a marker, it never rebuilds the map, remounts the component, or
 * triggers a React re-render of anything below it.
 *
 * Camera policy: follow the courier, but stop following the moment the receiver
 * touches the map, and give them an explicit button to resume. A map that yanks
 * itself back every three seconds is unusable.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crosshair, ExternalLink, MapPin, Minus, Plus } from 'lucide-react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import type { CourierLocation, GeoPoint } from '@/lib/tracking/contract';
import { bearingBetween, distanceMeters } from '@/lib/tracking/geo';
import 'maplibre-gl/dist/maplibre-gl.css';

const SUEZ_CENTER: [number, number] = [32.5498, 29.9668];
const DEFAULT_ZOOM = 14;
const FOLLOW_ZOOM = 15;

/** Fixes arrive about every 3s; the tween is a little shorter so it never lags. */
const MARKER_TRANSITION_MS = 900;

/** Below this, two fixes are GPS jitter and the marker keeps its current facing. */
const MIN_BEARING_DISTANCE_M = 8;

/**
 * MapTiler when a key is configured, otherwise OpenFreeMap — keyless, so the
 * map still works in development and on a fresh deploy. Production should set
 * the key so tiles are served under our own quota.
 */
function styleUrl(): string {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  return key
    ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`
    : 'https://tiles.openfreemap.org/styles/liberty';
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

type CourierElement = {
  root: HTMLDivElement;
  disc: HTMLSpanElement;
  arrow: HTMLDivElement;
  halo: HTMLSpanElement;
};

/** Courier pin: pulsing halo, brand disc, and an arrow rotated to the heading. */
function createCourierElement(label: string): CourierElement {
  const root = document.createElement('div');
  root.className = 'relative flex h-11 w-11 items-center justify-center';
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', label);

  const halo = document.createElement('span');
  halo.className =
    'fawran-courier-pulse absolute inset-0 rounded-full bg-[#1B6AFF] opacity-40';
  root.appendChild(halo);

  const disc = document.createElement('span');
  disc.className =
    'relative flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-white bg-[#1B6AFF] shadow-[0_4px_14px_rgba(27,106,255,0.45)] transition-colors duration-500';
  root.appendChild(disc);

  const arrow = document.createElement('div');
  arrow.className = 'transition-transform duration-700 ease-out';
  arrow.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 19.5 20l-7.5-4-7.5 4L12 3.5Z" fill="#ffffff" />
    </svg>`;
  disc.appendChild(arrow);

  return { root, disc, arrow, halo };
}

/** Destination pin: accent-orange teardrop, visually distinct from the courier. */
function createDestinationElement(label: string): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'flex flex-col items-center';
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', label);
  root.innerHTML = `
    <span class="flex h-8 w-8 items-center justify-center rounded-full border-[2.5px] border-white bg-[#FF6B1A] shadow-[0_4px_12px_rgba(255,107,26,0.4)]">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" fill="#ffffff"/>
        <circle cx="12" cy="10" r="2.5" fill="#FF6B1A"/>
      </svg>
    </span>
    <span class="mt-[-2px] h-2 w-2 rotate-45 bg-white"></span>`;
  return root;
}

type Props = {
  courier: CourierLocation | null;
  destination: GeoPoint | null;
  /** Live delivery with a streaming courier. Stops the follow camera when false. */
  isActive: boolean;
  /** The last fix is old enough that the marker should stop looking live. */
  isStale: boolean;
};

function TrackingMap({ courier, destination, isActive, isStale }: Props) {
  const t = useTranslations('track');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const courierMarkerRef = useRef<Marker | null>(null);
  const courierElementRef = useRef<CourierElement | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const animationRef = useRef<number | null>(null);
  const hasFittedRef = useRef(false);

  /**
   * Previous fix, kept only to derive the marker's facing. The public contract
   * carries no heading and the backend keeps no GPS history — this is two
   * points in memory, not a trail, and it is never drawn.
   */
  const previousPointRef = useRef<GeoPoint | null>(null);
  const headingRef = useRef(0);

  /** Auto-follow is on until the receiver pans/zooms for themselves. */
  const followRef = useRef(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Latest props for use inside map callbacks without re-running setup.
  const courierRef = useRef(courier);
  courierRef.current = courier;
  const destinationRef = useRef(destination);
  destinationRef.current = destination;

  // ── Create the map once ──────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: MapLibreMap | null = null;
    let disposed = false;

    void import('maplibre-gl').then((maplibre) => {
      if (disposed || !containerRef.current) return;

      // maplibre-gl leaves its worker URL empty and expects the app to set it.
      // Unset, the browser resolves "" to this page and tries to run its HTML
      // as a script: the canvas mounts, no tile is ever requested, and `load`
      // never fires. The file is copied into /public before dev and build by
      // scripts/sync-maplibre-worker.mjs.
      maplibre.setWorkerUrl('/vendor/maplibre-gl-worker.js');

      // OSM place names in Suez are Arabic regardless of UI locale, so the RTL
      // shaping plugin must always load — gating it on `locale === 'ar'` left
      // English pages rendering reversed labels ("سيوسلا" instead of "السويس").
      // Self-hosted in /public; `lazy` defers the download until RTL glyphs are
      // actually drawn.
      if (maplibre.getRTLTextPluginStatus() === 'unavailable') {
        try {
          maplibre.setRTLTextPlugin('/vendor/mapbox-gl-rtl-text.js', true);
        } catch {
          // Already registered by another mount — labels still shape correctly.
        }
      }

      const start = courierRef.current ?? destinationRef.current;

      map = new maplibre.Map({
        container: containerRef.current,
        style: styleUrl(),
        center: start ? [start.longitude, start.latitude] : SUEZ_CENTER,
        zoom: start ? FOLLOW_ZOOM : DEFAULT_ZOOM,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
      });

      map.touchZoomRotate.disableRotation();
      mapRef.current = map;

      // Any deliberate gesture hands camera control to the receiver.
      const releaseFollow = () => {
        if (!followRef.current) return;
        followRef.current = false;
        setIsFollowing(false);
      };
      map.on('dragstart', releaseFollow);
      map.on('zoomstart', (event) => {
        // Ignore the programmatic easeTo/fitBounds we issue ourselves.
        if ((event as { originalEvent?: unknown }).originalEvent) releaseFollow();
      });

      map.on('load', () => {
        if (!disposed) setIsReady(true);
      });
    });

    return () => {
      disposed = true;
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      courierMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      courierMarkerRef.current = null;
      destinationMarkerRef.current = null;
      courierElementRef.current = null;
      previousPointRef.current = null;
      // A new map starts unframed. Without this, React's development remount
      // leaves the second map showing the default view forever.
      hasFittedRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The refs above carry the latest positions into this effect; the map is
    // created exactly once for the lifetime of the page.
  }, []);

  // ── Destination marker ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    if (!destination) {
      destinationMarkerRef.current?.remove();
      destinationMarkerRef.current = null;
      return;
    }

    const position: [number, number] = [destination.longitude, destination.latitude];

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setLngLat(position);
      return;
    }

    void import('maplibre-gl').then((maplibre) => {
      if (!mapRef.current || destinationMarkerRef.current) return;
      destinationMarkerRef.current = new maplibre.Marker({
        element: createDestinationElement(t('map_destination')),
        anchor: 'bottom',
      })
        .setLngLat(position)
        .addTo(mapRef.current);
    });
  }, [destination, isReady, t]);

  // ── Courier marker: create, then animate between fixes ────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady) return;

    // A delivery that ends drops its location. Remove the pin rather than
    // leaving a ghost courier sitting on the map.
    if (!courier) {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      courierMarkerRef.current?.remove();
      courierMarkerRef.current = null;
      courierElementRef.current = null;
      previousPointRef.current = null;
      return;
    }

    const target: [number, number] = [courier.longitude, courier.latitude];

    // Derive the facing from the step just taken, ignoring GPS jitter.
    const previous = previousPointRef.current;
    if (previous && distanceMeters(previous, courier) >= MIN_BEARING_DISTANCE_M) {
      headingRef.current = bearingBetween(previous, courier);
    }
    previousPointRef.current = { latitude: courier.latitude, longitude: courier.longitude };

    if (courierElementRef.current) {
      courierElementRef.current.arrow.style.transform = `rotate(${headingRef.current}deg)`;
    }

    if (!courierMarkerRef.current) {
      void import('maplibre-gl').then((maplibre) => {
        if (!mapRef.current || courierMarkerRef.current) return;

        const element = createCourierElement(t('map_courier'));
        courierElementRef.current = element;
        element.arrow.style.transform = `rotate(${headingRef.current}deg)`;

        courierMarkerRef.current = new maplibre.Marker({ element: element.root })
          .setLngLat(target)
          .addTo(mapRef.current);
      });
      return;
    }

    // Interpolate from the current position so the pin glides rather than
    // teleporting. Cancels any in-flight tween first, so bursts of updates do
    // not stack animations on top of each other.
    const marker = courierMarkerRef.current;
    const from = marker.getLngLat();

    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);

    if (prefersReducedMotion()) {
      marker.setLngLat(target);
      return;
    }

    const startedAt = performance.now();
    const step = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / MARKER_TRANSITION_MS);
      // easeOutCubic — quick to respond, settles gently.
      const eased = 1 - Math.pow(1 - progress, 3);

      marker.setLngLat([
        from.lng + (target[0] - from.lng) * eased,
        from.lat + (target[1] - from.lat) * eased,
      ]);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(step);
  }, [courier, isReady, t]);

  // ── Marker liveness ──────────────────────────────────────────────────────
  //
  // The pulsing halo is a claim that something is moving right now. It stops
  // when the delivery ends, and the pin greys out when the last fix is old —
  // a courier in a tunnel should look paused, not like a broken page.
  useEffect(() => {
    const element = courierElementRef.current;
    if (!element) return;

    const showPulse = isActive && !isStale;
    element.halo.classList.toggle('fawran-courier-pulse', showPulse);
    element.halo.style.opacity = showPulse ? '' : '0';

    element.disc.classList.toggle('bg-[#1B6AFF]', !isStale);
    element.disc.classList.toggle('bg-[#9BA5BF]', isStale);
  }, [isActive, isStale, courier]);

  // ── Camera ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || !courier) return;

    const target: [number, number] = [courier.longitude, courier.latitude];

    // First fix: frame courier and destination together so the receiver sees
    // the whole journey at a glance. Everything after is a gentle follow.
    if (!hasFittedRef.current) {
      hasFittedRef.current = true;

      if (destination) {
        // fitBounds takes [southWest, northEast]. Handing it the two points in
        // arrival order inverts the box whenever the courier happens to be east
        // of (or north of) the destination, and an inverted box wraps the globe.
        map.fitBounds(
          [
            [
              Math.min(courier.longitude, destination.longitude),
              Math.min(courier.latitude, destination.latitude),
            ],
            [
              Math.max(courier.longitude, destination.longitude),
              Math.max(courier.latitude, destination.latitude),
            ],
          ],
          {
            // Generous enough that neither marker lands under the zoom
            // controls (top) or the Google Maps link and attribution (bottom).
            padding: { top: 104, bottom: 96, left: 72, right: 72 },
            maxZoom: FOLLOW_ZOOM,
            duration: 0,
          },
        );
      } else {
        map.jumpTo({ center: target, zoom: FOLLOW_ZOOM });
      }
      return;
    }

    if (!followRef.current || !isActive) return;

    // Only chase the courier once they near the edge of the view. Re-centring
    // on every fix makes the map feel like it is fighting you.
    const bounds = map.getBounds();
    const west = bounds.getWest();
    const east = bounds.getEast();
    const south = bounds.getSouth();
    const north = bounds.getNorth();
    const insetLng = (east - west) * 0.2;
    const insetLat = (north - south) * 0.2;

    const isComfortablyInside =
      target[0] > west + insetLng &&
      target[0] < east - insetLng &&
      target[1] > south + insetLat &&
      target[1] < north - insetLat;

    if (isComfortablyInside) return;

    map.easeTo({
      center: target,
      duration: prefersReducedMotion() ? 0 : 1_200,
      essential: true,
    });
  }, [courier, destination, isActive, isReady]);

  const recenter = useCallback(() => {
    const map = mapRef.current;
    const current = courierRef.current;
    if (!map || !current) return;

    followRef.current = true;
    setIsFollowing(true);
    map.easeTo({
      center: [current.longitude, current.latitude],
      zoom: Math.max(map.getZoom(), FOLLOW_ZOOM),
      duration: prefersReducedMotion() ? 0 : 800,
      essential: true,
    });
  }, []);

  const zoomBy = useCallback((delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: map.getZoom() + delta, duration: 300, essential: true });
  }, []);

  const point = courier ?? destination;
  const googleMapsHref = point
    ? `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`
    : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#EEF1F8]">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label={t('map_label')}
      />

      {/* Skeleton until the style has painted, so the receiver never stares at
          a blank grey rectangle on a slow connection. */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#EEF1F8]">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#C8CEDF] border-t-[#1B6AFF]" />
        </div>
      )}

      {/* Controls sit on the inline-end edge so they mirror correctly in RTL. */}
      <div className="absolute end-3 top-3 flex flex-col gap-2">
        <MapButton onClick={() => zoomBy(1)} label={t('map_zoom_in')}>
          <Plus size={18} aria-hidden="true" />
        </MapButton>
        <MapButton onClick={() => zoomBy(-1)} label={t('map_zoom_out')}>
          <Minus size={18} aria-hidden="true" />
        </MapButton>
        {courier && (
          <MapButton onClick={recenter} label={t('map_recenter')} active={isFollowing}>
            <Crosshair size={18} aria-hidden="true" />
          </MapButton>
        )}
      </div>

      {googleMapsHref && (
        <a
          href={googleMapsHref}
          target="_blank"
          // no-referrer, not just noopener: the tracking token is in this
          // page's URL and must not travel to Google in a Referer header.
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          // Sits clear of MapLibre's attribution bar, which owns the very
          // bottom edge and must stay legible.
          className="absolute bottom-9 start-3 inline-flex items-center gap-1.5 rounded-full border border-[#E2E6F0] bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#4A5270] shadow-sm backdrop-blur transition-colors hover:text-[#1B6AFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B6AFF]"
        >
          <ExternalLink size={14} aria-hidden="true" />
          {t('open_in_google_maps')}
        </a>
      )}
    </div>
  );
}

function MapButton({
  onClick,
  label,
  active = false,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border bg-white/95 shadow-sm backdrop-blur transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B6AFF] ${
        active
          ? 'border-[#1B6AFF] text-[#1B6AFF]'
          : 'border-[#E2E6F0] text-[#4A5270] hover:text-[#1B6AFF]'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Shown instead of the map when there is nothing to put on one. `SEARCHING` is
 * a normal first state, not an error — the copy says so.
 */
export function TrackingMapPlaceholder() {
  const t = useTranslations('track');

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#EEF1F8] px-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
        <MapPin size={24} className="text-[#9BA5BF]" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-[#4A5270]">{t('map_waiting')}</p>
      <p className="max-w-xs text-xs leading-relaxed text-[#9BA5BF]">{t('map_waiting_body')}</p>
    </div>
  );
}

// Memoized so the once-a-second freshness tick in the parent cannot re-render
// the map subtree. Only a genuinely new fix or destination gets through.
export default memo(TrackingMap);
