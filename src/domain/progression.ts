import {
  EXERCISES,
  PROGRESSION_THRESHOLD_DAYS,
  exerciseById,
  type ExerciseId,
} from './routine'
import type { DailyLog, Settings } from './types'
import { allSportDone } from './streak'
import { addDays, diffDays, todayKey } from '../lib/date'

export interface ProgressionStatus {
  exerciseId: ExerciseId
  currentTarget: number
  nextTarget: number
  /** Jours sport réussis consécutifs depuis le palier courant. */
  daysDone: number
  threshold: number
  /** Le seuil est atteint : on peut proposer la progression. */
  ready: boolean
}

/**
 * Compte les jours consécutifs (en remontant depuis aujourd'hui) où les 4 blocs
 * de sport ont été faits, sans descendre avant la date `since`.
 * Aujourd'hui n'est compté que s'il est déjà complet.
 */
function consecutiveSportDays(
  byDate: Map<string, DailyLog>,
  since: string,
  today: string,
): number {
  let count = 0
  let cursor = today
  // Aujourd'hui n'est pris en compte que s'il est complet.
  if (!allSportDone(byDate.get(today))) {
    cursor = addDays(today, -1)
  }
  while (diffDays(since, cursor) >= 0) {
    if (allSportDone(byDate.get(cursor))) {
      count++
      cursor = addDays(cursor, -1)
    } else {
      break
    }
  }
  return count
}

/** Statut de progression d'un exercice donné. */
export function progressionFor(
  exerciseId: ExerciseId,
  logs: DailyLog[],
  settings: Settings,
  today: string = todayKey(),
): ProgressionStatus {
  const def = exerciseById(exerciseId)
  const byDate = new Map(logs.map((l) => [l.date, l]))
  const since = settings.targetSince[exerciseId] ?? today
  const daysDone = consecutiveSportDays(byDate, since, today)
  const currentTarget = settings.targets[exerciseId]
  return {
    exerciseId,
    currentTarget,
    nextTarget: currentTarget + def.increment,
    daysDone,
    threshold: PROGRESSION_THRESHOLD_DAYS,
    ready: daysDone >= PROGRESSION_THRESHOLD_DAYS,
  }
}

/** Statut de progression pour tous les exercices. */
export function allProgressions(
  logs: DailyLog[],
  settings: Settings,
  today: string = todayKey(),
): ProgressionStatus[] {
  return EXERCISES.map((e) => progressionFor(e.id, logs, settings, today))
}
