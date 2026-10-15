import { site, contact, zones, currency, priceRange } from '../data/site.js';

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

/** Identifiant stable de l'organisation : référencé depuis toutes les pages. */
export const ORG_ID = `${site.url}/#organization`;

/**
 * Référence vers l'organisation (jamais de NAP dupliqué dans les pages :
 * l'entité complète est décrite une seule fois, sur l'accueil).
 */
export const orgRef = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: site.name,
  url: site.url,
};

/** Zones desservies : toutes les villes + le pays. */
export const areaServed = [
  ...zones.map((name) => ({ '@type': 'City', name })),
  { '@type': 'Country', name: contact.address.countryLabel },
];

/** Horaires au format schema.org, dérivés de la config (source unique). */
export const openingHoursSpecification = contact.hours
  .filter((h) => h.schema)
  .map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.schema.days,
    opens: h.schema.opens,
    closes: h.schema.closes,
  }));

/** Devise et fourchette de prix (voir src/data/site.js). */
export const currencyAccepted = currency;
export const priceRangeLabel = priceRange;

/**
 * Données structurées de la page d'accueil.
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
      ...(localBusiness ? { publisher: { '@id': ORG_ID } } : {}),
    },
  ];

  if (localBusiness) {
    const { '@context': _ctx, ...rest } = localBusiness as Record<string, unknown>;
    graph.push({ '@id': ORG_ID, ...rest });
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
    provider: orgRef,
    areaServed,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: title,
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: title } },
      ],
    },
  };
}

/** JSON-LD BlogPosting pour un article du blog. */
export function blogPostingData({
  slug,
  title,
  description,
  image,
  date,
  category,
}: {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
  category: string;
}) {
  const url = `${site.url}/blog/${slug}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: title,
    description,
    image: `${site.url}${image}`,
    datePublished: date,
    dateModified: date,
    author: { '@type': 'Organization', name: site.name, url: site.url },
    publisher: { '@id': ORG_ID },
    articleSection: category,
    inLanguage: site.lang,
    isPartOf: { '@id': `${site.url}/#website` },
  };
}

/** JSON-LD FAQPage pour une liste de questions/réponses. */
export function faqData(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
