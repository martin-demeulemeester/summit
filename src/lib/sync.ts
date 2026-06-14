import { supabase } from './supabase'
import { db, getAllLogs, putLogRaw, putSettingsRaw } from '../db/db'
import type { DailyLog, Settings } from '../domain/types'

// --- Conversion local <-> lignes Supabase ---------------------------------

interface LogRow {
  user_id: string
  date: string
  tasks: DailyLog['tasks']
  sport_blocks: number
  updated_at: number
}

function logToRow(userId: string, log: DailyLog): LogRow {
  return {
    user_id: userId,
    date: log.date,
    tasks: log.tasks,
    sport_blocks: log.sportBlocks,
    updated_at: log.updatedAt,
  }
}

function rowToLog(row: LogRow): DailyLog {
  return {
    date: row.date,
    tasks: row.tasks ?? {},
    sportBlocks: row.sport_blocks ?? 0,
    updatedAt: Number(row.updated_at) || 0,
  }
}

// --- Synchro des logs (last-write-wins par date) --------------------------

async function syncLogs(userId: string): Promise<void> {
  if (!supabase) return
  const { data, error } = await supabase.from('daily_logs').select('*').eq('user_id', userId)
  if (error) throw error

  const cloud = new Map<string, DailyLog>((data ?? []).map((r) => [r.date, rowToLog(r as LogRow)]))
  const local = new Map<string, DailyLog>((await getAllLogs()).map((l) => [l.date, l]))

  const dates = new Set<string>([...cloud.keys(), ...local.keys()])
  const toUpload: DailyLog[] = []

  for (const date of dates) {
    const l = local.get(date)
    const c = cloud.get(date)
    if (l && c) {
      if (l.updatedAt > c.updatedAt) toUpload.push(l)
      else if (c.updatedAt > l.updatedAt) await putLogRaw(c)
    } else if (l && !c) {
      toUpload.push(l)
    } else if (c && !l) {
      await putLogRaw(c)
    }
  }

  if (toUpload.length > 0) {
    const { error: upErr } = await supabase
      .from('daily_logs')
      .upsert(toUpload.map((l) => logToRow(userId, l)))
    if (upErr) throw upErr
  }
}

// --- Synchro des réglages (last-write-wins) -------------------------------

async function syncSettings(userId: string): Promise<void> {
  if (!supabase) return
  const { data: row, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error

  const local = await db.settings.get('app')
  const localUpdated = local?.updatedAt ?? 0
  const cloudUpdated = row ? Number(row.updated_at) || 0 : -1

  if (row && cloudUpdated > localUpdated) {
    const merged: Settings = { ...(row.data as Omit<Settings, 'id'>), id: 'app', updatedAt: cloudUpdated }
    await putSettingsRaw(merged)
  } else if (local && localUpdated > cloudUpdated) {
    const { id: _id, ...data } = local
    void _id
    const { error: upErr } = await supabase
      .from('settings')
      .upsert({ user_id: userId, data, updated_at: localUpdated })
    if (upErr) throw upErr
  }
}

/** Synchronise réglages puis logs avec le cloud. */
export async function fullSync(userId: string): Promise<void> {
  await syncSettings(userId)
  await syncLogs(userId)
}
