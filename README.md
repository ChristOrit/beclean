# BeClean — Site vitrine paysagiste (Cotonou, Bénin)

Site vitrine de **Be Clean**, entreprise de paysagisme à Cotonou (Bénin) : présentation des services, blog, demandes de devis/contact, newsletter, pages SEO locales et un studio interne de génération de badges d'équipe.
Astro + Tailwind, build statique avec routes API serverless, déployé sur Vercel.

## URLs

- Production : https://beclean-benin.vercel.app
- Domaine cible : https://benin-paysage.com

## Stack

- Astro 7 (`output: 'static'`, adaptateur `@astrojs/vercel`) · Tailwind CSS 3 · TypeScript
- Sitemap (`@astrojs/sitemap`, `/api/*` et `/studio/*` exclus)
- Routes API : e-mailing via Resend (contact/devis), newsletter via Brevo
- Studio badges : Postgres serverless (Neon)

## Pages et fonctionnalités

- **Pages vitrine** : accueil, services (`/services/[slug]`), réalisations, boutique, à propos, blog (`/blog/[slug]`), secteurs (particuliers / entreprises), mentions légales, politique de confidentialité, 404.
- **SEO local** : pages ciblées (« paysagiste-cotonou », « jardinier-cotonou », etc.), données structurées, fil d'Ariane, sitemap avec `lastmod` des articles.
- **Formulaires** : contact, devis (anti-spam par temps de remplissage, envoi e-mail via Resend avec fallback WhatsApp) et newsletter (inscription à une liste Brevo).
- **Studio badges** (`/studio/badges`, protégé par mot de passe) : atelier interne générant les badges CR80 de l'équipe (photo, rôle, matricule, QR), données membres/entreprise stockées dans Neon.

## Commandes

```sh
npm install
npm run dev      # serveur de développement (localhost:4321)
npm run build    # build de production -> dist/
npm run preview  # prévisualisation du build
npm run check    # astro check (types)
```

Node.js ≥ 22.12 requis.

## Variables d'environnement

Voir [`.env.example`](./.env.example). À configurer dans Vercel → Settings → Environment Variables :

- `DATABASE_URL` (Neon) + `BADGES_STUDIO_PWD` / `BADGES_STUDIO_SECRET` — studio badges
- `RESEND_API_KEY`, `RESEND_FROM`, `LEADS_TO_EMAIL` — e-mails contact/devis
- `BREVO_API_KEY`, `BREVO_LIST_ID` — newsletter

## Déploiement

Push sur la branche `main` → Vercel build et déploie automatiquement.

## Structure

```
src/
  pages/       Pages .astro + routes API (pages/api)
  components/  Composants Astro (Header, FAQ, CTA, témoignages…)
  layouts/     Layout global
  data/        Contenu centralisé (site.js, services.js, blog.js)
  lib/         Mailer, badges (auth/db), SEO, dates
public/        Assets statiques
```
