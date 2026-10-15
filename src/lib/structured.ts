import { site, contact, zones } from '../data/site.js';

export const NAP = {
  name: site.name,
  legalName: site.legalName,
  telephone: contact.phoneE164,
  email: contact.email,
  street: contact.address.street,
  city: contact.address.city,
  region: contact.address.region,
  country: contact.address.country,
  geo: contact.geo,
};

export const AREAS = zones;

/**
 * Données structurées du site (page d'accueil).
 * `localBusiness` est un sous-type d'Organization : on le met dans le même
 * graphe pour éviter deux entités qui se décrivent en double.
 */
export function websiteData(localBusiness?: Record<string, unknown>) {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${site.url}/#website`,
      url: `${site.url}/`,
      name: site.name,
      description:
        "Paysagiste à Cotonou : conception, création et entretien de jardins et d'espaces verts au Bénin.",
      inLanguage: site.lang,
      ...(localBusiness ? { publisher: { '@id': `${site.url}/#organization` } } : {}),
    },
  ];

  if (localBusiness) {
    const { '@context': _ctx, ...rest } = localBusiness as Record<string, unknown>;
    graph.push({ '@id': `${site.url}/#organization`, ...rest });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** JSON-LD Service pour une page de service. */
export function serviceData({ slug, title, description }: { slug: string; title: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    description,
    url: `${site.url}/services/${slug}/`,
    serviceType: title,
    provider: {
      '@type': 'Organization',
      name: NAP.name,
      telephone: NAP.telephone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: NAP.street,
        addressLocality: NAP.city,
        addressRegion: NAP.region,
        addressCountry: NAP.country,
      },
    },
    areaServed: { '@type': 'City', name: 'Cotonou' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
    },
  };
}
