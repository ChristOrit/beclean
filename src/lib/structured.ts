const SITE = 'https://beclean-benin.vercel.app';

export const NAP = {
  name: 'Be Clean',
  alternateName: 'Paysage Plus Cotonou',
  telephone: '+2290167592319',
  email: 'oritchrist@gmail.com',
  street: 'Rue 12.045, Haie Vive',
  city: 'Cotonou',
  region: 'Littoral',
  country: 'BJ',
  geo: { latitude: '6.3700', longitude: '2.4300' },
};

export const AREAS = [
  'Cotonou',
  'Abomey-Calavi',
  'Porto-Novo',
  'Calavi',
  'Sèmè-Podji',
  'Ouidah',
];

/**
 * Données structurées du site (page d'accueil).
 * `localBusiness` est un sous-type d'Organization : on le met dans le même
 * graphe pour éviter deux entités qui se décrivent en double.
 */
export function websiteData(localBusiness?: Record<string, unknown>) {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'Be Clean',
      description:
        "Paysagiste à Cotonou : conception, création et entretien de jardins et d'espaces verts au Bénin.",
      inLanguage: 'fr',
      ...(localBusiness ? { publisher: { '@id': `${SITE}/#organization` } } : {}),
    },
  ];

  if (localBusiness) {
    const { '@context': _ctx, ...rest } = localBusiness as Record<string, unknown>;
    graph.push({ '@id': `${SITE}/#organization`, ...rest });
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
    url: `${SITE}/services/${slug}/`,
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
