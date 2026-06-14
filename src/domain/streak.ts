import { DAILY_TASKS, SPORT_BLOCKS_PER_DAY } from './routine'
import type { DailyLog, DayStatus, StreakSummary } from './types'
import { addDays, diffDays, todayKey } from '../lib/date'

/** Nombre de jours parfaits consécutifs qui octroient un joker. */
export const JOKER_EARN_EVERY = 7

/** Toutes les tâches quotidiennes sont-elles cochées ? */
export function allTasksDone(log: DailyLog | undefined): boolean {
  if (!log) return false
  return DAILY_TASKS.every((t) => log.tasks[t.id] === true)
}

/** Les 4 blocs de sport sont-ils faits ? */
export function allSportDone(log: DailyLog | undefined): boolean {
  return (log?.sportBlocks ?? 0) >= SPORT_BLOCKS_PER_DAY
}

/** Journée parfaite : toutes les tâches + tous les blocs de sport. */
export function isDayComplete(log: DailyLog | undefined): boolean {
  return allTasksDone(log) && allSportDone(log)
}

/** Y a-t-il au moins une chose de faite ce jour-là ? */
export function hasAnyProgress(log: DailyLog | undefined): boolean {
  if (!log) return false
  if ((log.sportBlocks ?? 0) > 0) return true
  return DAILY_TASKS.some((t) => log.tasks[t.id] === true)
}

/** Nombre total d'items du jour (tâches + blocs de sport). */
export const TOTAL_DAILY_ITEMS = DAILY_TASKS.length + SPORT_BLOCKS_PER_DAY

/** Nombre d'items complétés pour un jour donné. */
export function dayDoneCount(log: DailyLog | undefined): number {
  if (!log) return 0
  const tasks = DAILY_TASKS.filter((t) => log.tasks[t.id] === true).length
  const sport = Math.min(log.sportBlocks ?? 0, SPORT_BLOCKS_PER_DAY)
  return tasks + sport
}

/**
 * Calcule le streak, les jokers et le statut de chaque jour à partir de
 * l'historique. Règles :
 * - un jour parfait fait progresser le streak ; tous les 7 jours parfaits
 *   consécutifs, on gagne 1 joker ;
 * - un jour raté (passé) consomme un joker si disponible (le streak est
 *   préservé), sinon casse le streak ;
 * - aujourd'hui ne casse jamais le streak tant que la journée n'est pas finie.
 */
export function computeStreak(
  logs: DailyLog[],
  today: string = todayKey(),
): StreakSummary {
  const byDate = new Map(logs.map((l) => [l.date, l]))

  // Bornes : du premier jour enregistré jusqu'à aujourd'hui.
  const dates = logs.map((l) => l.date).filter((d) => d <= today)
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, jokers: 0, days: [] }
  }
  const firstDate = dates.reduce((a, b) => (a < b ? a : b))

  let jokers = 0
  let perfectRun = 0 // pour l'octroi de jokers (jours parfaits purs)
  let currentRun = 0 // streak (parfait + joker)
  let longest = 0
  const days: { date: string; status: DayStatus }[] = []

  const span = diffDays(firstDate, today)
  for (let i = 0; i <= span; i++) {
    const date = addDays(firstDate, i)
    const log = byDate.get(date)
    const complete = isDayComplete(log)
    const isToday = date === today

    if (complete) {
      currentRun++
      perfectRun++
      if (perfectRun % JOKER_EARN_EVERY === 0) jokers++
      days.push({ date, status: 'parfaite' })
    } else if (isToday) {
      // La journée n'est pas finie : ni faute, ni rupture.
      days.push({ date, status: hasAnyProgress(log) ? 'partielle' : 'vide' })
    } else if (jokers > 0) {
      // Jour raté couvert par un joker.
      jokers--
      currentRun++
      perfectRun = 0
      days.push({ date, status: 'joker' })
    } else {
      // Faute : le streak casse.
      currentRun = 0
      perfectRun = 0
      days.push({ date, status: 'faute' })
    }
    longest = Math.max(longest, currentRun)
  }

  return { currentStreak: currentRun, longestStreak: longest, jokers, days }
}
