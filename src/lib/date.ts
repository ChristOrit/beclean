/**
 * Formatage des dates pour l'affichage.
 *
 * Les dates sont stockées en `AAAA-MM-JJ` (sans heure). On force midi UTC puis
 * un rendu en UTC pour qu'aucun décalage horaire ne fasse changer de jour.
 */
const FR_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** `2025-02-10` → `10 février 2025`. */
export function formatDate(date: string) {
  return FR_DATE.format(new Date(`${date}T12:00:00Z`));
}

/** Liste triée du plus récent au plus ancien. */
export function byDateDesc<T extends { date: string }>(items: T[]) {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}
