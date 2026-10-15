/**
 * Déclarations des fonctions globales exposées par les scripts inline
 * (voir src/layouts/Layout.astro). Elles sont appelées depuis d'autres scripts.
 */
declare global {
  interface Window {
    /** Relance l'animation de révélation après un filtrage côté client. */
    sweepMotion?: () => void;
    /** Recalcule la couleur d'accent des éléments mis en avant. */
    paintAccents?: () => void;
  }
}

export {};
