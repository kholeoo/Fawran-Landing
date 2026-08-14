/**
 * Build a `tel:` href from a stored mobile number.
 *
 * Display can stay local (`012…`). The href needs an international form so the
 * phone app can dial it. Local EG `01…` becomes `+201…`.
 */
export function toTelHref(raw: string, defaultCountryCode = '20'): string | null {
  let digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) {
    digits = `${defaultCountryCode}${digits.slice(1)}`;
  }
  return `tel:+${digits}`;
}
