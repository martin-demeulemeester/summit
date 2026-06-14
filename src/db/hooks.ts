import { useLiveQuery } from 'dexie-react-hooks'
import { getAllLogs, getLog, readSettings } from './db'
import type { DailyLog, Settings } from '../domain/types'

/** Réglages réactifs (undefined le temps du chargement initial). */
export function useSettings(): Settings | undefined {
  return useLiveQuery(() => readSettings(), [])
}

/** Log réactif d'un jour donné. */
export function useLog(date: string): DailyLog | undefined {
  return useLiveQuery(() => getLog(date), [date])
}

/** Tous les logs, triés par date. */
export function useAllLogs(): DailyLog[] | undefined {
  return useLiveQuery(() => getAllLogs(), [])
}
