/**
 * SOURCE UNIQUE DE VÉRITÉ du site BeClean.
 *
 * Toute donnée de marque, contact (NAP), zones et chiffres clés doit venir
 * d'ici. Ne jamais recoder ces valeurs en dur dans les pages ou composants.
 */

/** Identité & domaine. */
export const site = {
  name: 'BeClean',
  legalName: 'Établissement BeClean',
  tagline: 'Du rêve à la réalité, en toute harmonie.',
  // Domaine provisoire : basculer sur le domaine final en changeant cette ligne.
  url: 'https://beclean-benin.vercel.app',
  lang: 'fr',
  ogImage: '/og-image.jpg',
};

/** Coordonnées (NAP) — identiques partout. */
export const contact = {
  phoneDisplay: '+229 01 67 59 23 19',
  phoneShort: '01 67 59 23 19',
  phoneE164: '+2290167592319',
  // WhatsApp : sans le préfixe "01" (contrainte de l'application).
  whatsapp: '22967592319',
  email: 'oritchrist@gmail.com',
  address: {
    street: 'Jéricho',
    city: 'Cotonou',
    region: 'Littoral',
    country: 'BJ',
    countryLabel: 'Bénin',
  },
  geo: { latitude: '6.3654', longitude: '2.4266' },
  hours: [
    { days: 'Lun – Ven', time: '08h00 – 18h00' },
    { days: 'Sam', time: '09h00 – 13h00' },
  ],
};

/** Chiffres clés (une seule vérité pour tout le site). */
export const stats = {
  foundedYear: 2015,
  projectsCount: 25,
  projectsLabel: '25+',
  reviewsCount: 15,
  // Note moyenne communiquée par le gérant (> 4,5).
  ratingLabel: '4,5/5',
};

/** Années d'expérience calculées depuis l'année de création. */
export const yearsExperience = new Date().getFullYear() - stats.foundedYear;
export const experienceLabel = `${yearsExperience}+`;

/** Couverture : tout le Bénin, principaux pôles. */
export const coverageLabel = 'Tout le Bénin';
export const zones = [
  'Cotonou',
  'Abomey-Calavi',
  'Porto-Novo',
  'Sèmè-Podji',
  'Ouidah',
  'Parakou',
  'Bohicon',
  'Abomey',
  'Kandi',
  'Natitingou',
];

/** Liens dérivés de la config (jamais recodés). */
export const telHref = `tel:${contact.phoneE164}`;
export const whatsappHref = `https://wa.me/${contact.whatsapp}`;

/**
 * Réseaux sociaux.
 * Tant qu'une URL est vide (''), l'icône reste affichée mais désactivée
 * (« bientôt disponible »). Renseigner l'URL suffit à activer le lien.
 */
export const socialUrls = {
  facebook: '',
  instagram: '',
  linkedin: '',
};

