import { describe, expect, it } from 'vitest'
import { computeStreak, isDayComplete } from './streak'
import { DAILY_TASKS, SPORT_BLOCKS_PER_DAY } from './routine'
import type { DailyLog } from './types'

function perfect(date: string): DailyLog {
  const tasks: DailyLog['tasks'] = {}
  for (const t of DAILY_TASKS) tasks[t.id] = true
  return { date, tasks, sportBlocks: SPORT_BLOCKS_PER_DAY, updatedAt: 0 }
}

function partial(date: string): DailyLog {
  return { date, tasks: { visage_matin: true }, sportBlocks: 1, updatedAt: 0 }
}

describe('isDayComplete', () => {
  it('vrai uniquement si toutes les tâches et tous les blocs sont faits', () => {
    expect(isDayComplete(perfect('2026-06-01'))).toBe(true)
    expect(isDayComplete(partial('2026-06-01'))).toBe(false)
    expect(isDayComplete(undefined)).toBe(false)
  })
})

describe('computeStreak', () => {
  it('octroie 1 joker après 7 jours parfaits consécutifs', () => {
    const logs = ['01', '02', '03', '04', '05', '06', '07'].map((d) => perfect(`2026-06-${d}`))
    const s = computeStreak(logs, '2026-06-08')
    expect(s.currentStreak).toBe(7)
    expect(s.longestStreak).toBe(7)
    expect(s.jokers).toBe(1)
  })

  it("consomme un joker pour couvrir une journée ratée sans casser le streak", () => {
    const logs = [
      ...['01', '02', '03', '04', '05', '06', '07'].map((d) => perfect(`2026-06-${d}`)),
      partial('2026-06-08'), // jour raté, couvert par le joker gagné
    ]
    const s = computeStreak(logs, '2026-06-09')
    expect(s.currentStreak).toBe(8)
    expect(s.jokers).toBe(0)
    expect(s.days.find((d) => d.date === '2026-06-08')?.status).toBe('joker')
  })

  it('casse le streak en cas de faute sans joker disponible', () => {
    const logs = [perfect('2026-06-01'), partial('2026-06-02')]
    const s = computeStreak(logs, '2026-06-03')
    expect(s.currentStreak).toBe(0)
    expect(s.longestStreak).toBe(1)
    expect(s.days.find((d) => d.date === '2026-06-02')?.status).toBe('faute')
  })

  it("ne casse pas le streak pour la journée en cours incomplète", () => {
    const logs = [...['01', '02', '03'].map((d) => perfect(`2026-06-${d}`)), partial('2026-06-04')]
    const s = computeStreak(logs, '2026-06-04')
    expect(s.currentStreak).toBe(3)
    expect(s.days.find((d) => d.date === '2026-06-04')?.status).toBe('partielle')
  })
})
