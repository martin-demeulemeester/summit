import Dexie, { type Table } from 'dexie'
import { DAILY_TASKS, EXERCISES, SPORT_BLOCKS_PER_DAY, type TaskId } from '../domain/routine'
import type { DailyLog, Settings } from '../domain/types'
import { todayKey } from '../lib/date'

class SummitDB extends Dexie {
  dailyLogs!: Table<DailyLog, string>
  settings!: Table<Settings, string>

  constructor() {
    super('summit')
    this.version(1).stores({
      dailyLogs: '&date, updatedAt',
      settings: '&id',
    })
  }
}

export const db = new SummitDB()

/** Réglages par défaut au premier lancement. */
export function defaultSettings(): Settings {
  const today = todayKey()
  const times: Settings['reminders']['times'] = {}
  for (const t of DAILY_TASKS) times[t.id] = t.defaultReminder
  return {
    id: 'app',
    targets: Object.fromEntries(
      EXERCISES.map((e) => [e.id, e.initialTarget]),
    ) as Settings['targets'],
    reminders: {
      enabled: false,
      times,
      sportEndOfDay: '20:00',
    },
    targetSince: Object.fromEntries(
      EXERCISES.map((e) => [e.id, today]),
    ) as Settings['targetSince'],
    updatedAt: 0,
  }
}

/**
 * Lecture seule des réglages : renvoie l'existant ou les valeurs par défaut SANS
 * écrire. Indispensable pour être utilisé dans un `useLiveQuery` (lecture seule).
 */
export async function readSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? defaultSettings()
}

/** Persiste les réglages par défaut au premier lancement (hors liveQuery). */
export async function ensureSettings(): Promise<void> {
  const existing = await db.settings.get('app')
  if (!existing) await db.settings.put(defaultSettings())
}

export async function saveSettings(settings: Settings): Promise<void> {
  await db.settings.put({ ...settings, updatedAt: Date.now() })
}

/** Écrit des réglages tels quels (utilisé par la synchro, conserve updatedAt). */
export async function putSettingsRaw(settings: Settings): Promise<void> {
  await db.settings.put(settings)
}

/** Écrit un log tel quel (synchro, conserve updatedAt). */
export async function putLogRaw(log: DailyLog): Promise<void> {
  await db.dailyLogs.put(log)
}

/** Log d'un jour, créé vide si absent. */
function emptyLog(date: string): DailyLog {
  return { date, tasks: {}, sportBlocks: 0, updatedAt: Date.now() }
}

export async function getLog(date: string): Promise<DailyLog> {
  return (await db.dailyLogs.get(date)) ?? emptyLog(date)
}

export async function getAllLogs(): Promise<DailyLog[]> {
  return db.dailyLogs.orderBy('date').toArray()
}

/** Bascule l'état d'une tâche pour un jour donné. */
export async function toggleTask(date: string, taskId: TaskId): Promise<void> {
  const log = await getLog(date)
  const next: DailyLog = {
    ...log,
    tasks: { ...log.tasks, [taskId]: !log.tasks[taskId] },
    updatedAt: Date.now(),
  }
  await db.dailyLogs.put(next)
}

/** Définit le nombre de blocs de sport complétés (borné). */
export async function setSportBlocks(date: string, blocks: number): Promise<void> {
  const log = await getLog(date)
  const clamped = Math.max(0, Math.min(SPORT_BLOCKS_PER_DAY, blocks))
  await db.dailyLogs.put({ ...log, sportBlocks: clamped, updatedAt: Date.now() })
}

/** Incrémente d'un bloc de sport (utilisé à la fin d'une séance). */
export async function addSportBlock(date: string): Promise<void> {
  const log = await getLog(date)
  await setSportBlocks(date, (log.sportBlocks ?? 0) + 1)
}

/** Réinitialise toutes les données (logs + réglages). */
export async function resetAll(): Promise<void> {
  await db.dailyLogs.clear()
  await db.settings.clear()
}
