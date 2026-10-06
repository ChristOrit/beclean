import { services } from '../data/services.js';
import { blogPosts } from '../data/blog.js';

export interface Crumb {
  name: string;
  path: string;
}

const LABELS: Record<string, string> = {
  '/': 'Accueil',
  '/a-propos': 'À propos',
  '/boutique': 'Boutique',
  '/contact': 'Contact',
  '/devis': 'Devis gratuit',
  '/realisations': 'Réalisations',
  '/services': 'Services',
  '/blog': 'Blog',
  '/secteurs': 'Secteurs',
  '/secteurs/particuliers': 'Particuliers',
  '/secteurs/entreprises': 'Entreprises',
  '/paysagiste-cotonou': 'Paysagiste Cotonou',
  '/jardinier-cotonou': 'Jardinier Cotonou',
  '/jardinage-cotonou': 'Jardinage Cotonou',
  '/jardin-cotonou': 'Jardin Cotonou',
  '/amenagement-paysager-cotonou': 'Aménagement paysager Cotonou',
  '/societe-jardinage-benin': 'Société de jardinage Bénin',
};

const titleFromSlug = (slug: string) =>
  slug
    .split('-')
    .map((w) => (w.length > 3 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');

const NAMED: Record<string, string> = {
  ...Object.fromEntries(services.map((s) => [`/services/${s.slug}`, s.title])),
  ...Object.fromEntries(blogPosts.map((p) => [`/blog/${p.slug}`, p.title])),
};

/** Fil d'Ariane (sans l'accueil) déduit du chemin de la page. */
export function breadcrumbsFromPath(pathname: string): Crumb[] {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return [];

  const segments = path.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = '';

  segments.forEach((seg) => {
    acc += '/' + seg;
    crumbs.push({ name: NAMED[acc] || LABELS[acc] || titleFromSlug(seg), path: acc });
  });

  return crumbs;
}

/** JSON-LD BreadcrumbList à partir de chemins relatifs et de l'URL de base. */
export function breadcrumbList(crumbs: Crumb[], base: string) {
  if (!crumbs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: new URL(c.path + '/', base).toString(),
    })),
  };
}
