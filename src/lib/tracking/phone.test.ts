import { describe, expect, it } from 'vitest';
import { toTelHref } from './phone';

describe('toTelHref', () => {
  it('turns a local EG mobile into an international tel link', () => {
    expect(toTelHref('01208741247')).toBe('tel:+201208741247');
  });

  it('keeps an already-international number', () => {
    expect(toTelHref('+201208741247')).toBe('tel:+201208741247');
    expect(toTelHref('00201208741247')).toBe('tel:+201208741247');
  });

  it('strips spaces and punctuation', () => {
    expect(toTelHref('012 0874 1247')).toBe('tel:+201208741247');
  });

  it('returns null when there are no digits', () => {
    expect(toTelHref('')).toBeNull();
    expect(toTelHref('call me')).toBeNull();
  });
});
