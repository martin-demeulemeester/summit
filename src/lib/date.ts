// Utilitaires de date basés sur l'heure locale (clé au format YYYY-MM-DD).

/** Clé de date locale au format YYYY-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Clé du jour courant. */
export function todayKey(): string {
  return dateKey()
}

/** Convertit une clé YYYY-MM-DD en objet Date (minuit local). */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Ajoute (ou retire) un nombre de jours à une clé de date. */
export function addDays(key: string, days: number): string {
  const d = keyToDate(key)
  d.setDate(d.getDate() + days)
  return dateKey(d)
}

/** Différence en jours entre deux clés (b - a). */
export function diffDays(a: string, b: string): number {
  const ms = keyToDate(b).getTime() - keyToDate(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** Libellé court et lisible, ex. "sam. 14 juin". */
export function prettyDate(key: string): string {
  return keyToDate(key).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

/** Formate un nombre de secondes en mm:ss. */
export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
