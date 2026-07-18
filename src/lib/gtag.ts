// Thin, safe wrapper around the gtag global that @next/third-parties injects in
// production. In dev / preview / before load there is no gtag, so every call is a
// no-op and components can fire events unconditionally without guarding.
type GtagParams = Record<string, string | number | boolean | undefined>;

type GtagWindow = Window & {
  gtag?: (command: 'event', name: string, params?: GtagParams) => void;
};

export function trackEvent(name: string, params?: GtagParams) {
  if (typeof window === 'undefined') return;
  const { gtag } = window as GtagWindow;
  if (typeof gtag !== 'function') return;
  gtag('event', name, params);
}
