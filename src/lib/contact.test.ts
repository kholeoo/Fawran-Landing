import { describe, expect, it } from 'vitest';
import {
  buildContactPoint,
  contactEmail,
  contactPhoneE164,
  facebookUrl,
  instagramUrl,
  linkedinUrl,
} from './contact';
import { applicationSameAs, organizationSameAs } from './brand';

describe('buildContactPoint', () => {
  it('emits schema.org fields Google expects for Organization contact', () => {
    const point = buildContactPoint('Egypt');

    expect(point).toEqual({
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: contactEmail,
      telephone: contactPhoneE164,
      availableLanguage: ['Arabic', 'English'],
      areaServed: { '@type': 'Country', name: 'Egypt' },
    });
  });
});

describe('organizationSameAs', () => {
  it('includes the canonical social profiles for entity disambiguation', () => {
    expect(organizationSameAs).toEqual(
      expect.arrayContaining([facebookUrl, instagramUrl, linkedinUrl]),
    );
  });

  it('does not expose social URLs as applicationSameAs', () => {
    expect(applicationSameAs).not.toEqual(
      expect.arrayContaining([facebookUrl, instagramUrl, linkedinUrl]),
    );
  });
});

describe('contact constants', () => {
  it('uses E.164 phone format for structured data', () => {
    expect(contactPhoneE164).toMatch(/^\+20\d+$/);
  });

  it('uses a fawran.co mailbox aligned with the site domain', () => {
    expect(contactEmail).toMatch(/@fawran\.co$/);
  });
});
