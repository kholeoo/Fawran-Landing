export const contactEmail = 'company@fawran.co';
export const contactPhoneE164 = '+201208741247';
export const contactPhoneDisplay = '01208741247';

export const facebookUrl =
  'https://www.facebook.com/profile.php?id=61593220870254';
export const instagramUrl = 'https://www.instagram.com/fawrandelivery/';
export const linkedinUrl = 'https://www.linkedin.com/company/fawran-delivery';

export const socialLinks = [
  { name: 'Facebook', href: facebookUrl },
  { name: 'Instagram', href: instagramUrl },
  { name: 'LinkedIn', href: linkedinUrl },
] as const;

/** schema.org ContactPoint for Organization / DeliveryService JSON-LD. */
export function buildContactPoint(areaServedCountry: string) {
  return {
    '@type': 'ContactPoint' as const,
    contactType: 'customer service',
    email: contactEmail,
    telephone: contactPhoneE164,
    availableLanguage: ['Arabic', 'English'],
    areaServed: {
      '@type': 'Country' as const,
      name: areaServedCountry,
    },
  };
}
