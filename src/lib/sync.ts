import { supabase } from './supabase'
import { db, getAllLogs, putLogRaw, putSettingsRaw } from '../db/db'
import type { DailyLog, Settings } from '../domain/types'

interface CloudLog {
  date: string
  tasks: DailyLog['tasks']
  sport_blocks: number
  updated_at: number
}

interface PullPayload {
  settings: null | {
    data: Omit<Settings, 'id'>
    updated_at: number
  }
  daily_logs: CloudLog[]
}

function rowToLog(row: CloudLog): DailyLog {
  return {
    date: row.date,
    tasks: row.tasks ?? {},
    sportBlocks: row.sport_blocks ?? 0,
    updatedAt: Number(row.updated_at) || 0,
  }
}

function logToPayload(log: DailyLog): CloudLog {
  return {
    date: log.date,
    tasks: log.tasks,
    sport_blocks: log.sportBlocks,
    updated_at: log.updatedAt,
  }
}

/** Synchronise réglages puis logs avec le cloud. */
export async function fullSync(sessionToken: string): Promise<void> {
  if (!supabase) return

  const { data, error } = await supabase.rpc('summit_pull', { session_token: sessionToken })
  if (error) throw error

  const payload = data as PullPayload
  const cloudLogs = new Map<string, DailyLog>((payload.daily_logs ?? []).map((r) => [r.date, rowToLog(r)]))
  const localLogs = new Map<string, DailyLog>((await getAllLogs()).map((l) => [l.date, l]))
  const dates = new Set<string>([...cloudLogs.keys(), ...localLogs.keys()])
  const logsToUpload: DailyLog[] = []

  for (const date of dates) {
    const local = localLogs.get(date)
    const cloud = cloudLogs.get(date)
    if (local && cloud) {
      if (local.updatedAt > cloud.updatedAt) logsToUpload.push(local)
      else if (cloud.updatedAt > local.updatedAt) await putLogRaw(cloud)
    } else if (local && !cloud) {
      logsToUpload.push(local)
    } else if (cloud && !local) {
      await putLogRaw(cloud)
    }
  }

  const localSettings = await db.settings.get('app')
  const localSettingsUpdated = localSettings?.updatedAt ?? 0
  const cloudSettingsUpdated = payload.settings ? Number(payload.settings.updated_at) || 0 : -1
  let settingsToUpload: Settings | null = null

  if (payload.settings && cloudSettingsUpdated > localSettingsUpdated) {
    await putSettingsRaw({ ...payload.settings.data, id: 'app', updatedAt: cloudSettingsUpdated })
  } else if (localSettings && localSettingsUpdated > cloudSettingsUpdated) {
    settingsToUpload = localSettings
  }

  if (settingsToUpload || logsToUpload.length > 0) {
    const settingsData = settingsToUpload
      ? (() => {
          const { id: _id, ...data } = settingsToUpload
          void _id
          return data
        })()
      : null

    const { error: pushError } = await supabase.rpc('summit_push', {
      session_token: sessionToken,
      settings_payload: settingsData,
      settings_updated_at: settingsToUpload?.updatedAt ?? 0,
      logs_payload: logsToUpload.map(logToPayload),
    })
    if (pushError) throw pushError
  }
}
