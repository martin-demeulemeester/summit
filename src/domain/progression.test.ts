import { describe, expect, it } from 'vitest'
import { progressionFor } from './progression'
import { SPORT_BLOCKS_PER_DAY } from './routine'
import type { DailyLog, Settings } from './types'

function sportDay(date: string): DailyLog {
  return { date, tasks: {}, sportBlocks: SPORT_BLOCKS_PER_DAY, updatedAt: 0 }
}

function settings(targetSince: string): Settings {
  return {
    id: 'app',
    targets: { tractions: 5, pompes: 10, gainage: 90 },
    reminders: { enabled: false, times: {}, sportEndOfDay: '20:00' },
    targetSince: { tractions: targetSince, pompes: targetSince, gainage: targetSince },
    updatedAt: 0,
  }
}

describe('progressionFor', () => {
  it('propose une progression après 7 jours de sport complets au même palier', () => {
    const logs = ['01', '02', '03', '04', '05', '06', '07'].map((d) => sportDay(`2026-06-${d}`))
    const p = progressionFor('tractions', logs, settings('2026-06-01'), '2026-06-08')
    expect(p.daysDone).toBe(7)
    expect(p.ready).toBe(true)
    expect(p.nextTarget).toBe(6) // +1 pour les tractions
  })

  it('ne compte que les jours depuis le palier courant', () => {
    const logs = ['01', '02', '03', '04', '05', '06', '07'].map((d) => sportDay(`2026-06-${d}`))
    const p = progressionFor('tractions', logs, settings('2026-06-05'), '2026-06-08')
    expect(p.daysDone).toBe(3)
    expect(p.ready).toBe(false)
  })

  it("interrompt le compte dès qu'un jour de sport est incomplet", () => {
    const logs = [
      sportDay('2026-06-01'),
      sportDay('2026-06-02'),
      { date: '2026-06-03', tasks: {}, sportBlocks: 2, updatedAt: 0 },
      sportDay('2026-06-04'),
      sportDay('2026-06-05'),
    ]
    const p = progressionFor('pompes', logs, settings('2026-06-01'), '2026-06-06')
    expect(p.daysDone).toBe(2) // 04 et 05 ; coupé au 03 incomplet
  })
})
