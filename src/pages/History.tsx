import { useAllLogs } from '../db/hooks'
import { computeStreak } from '../domain/streak'
import type { DayStatus } from '../domain/types'
import { addDays, keyToDate, prettyDate, todayKey } from '../lib/date'

const STATUS_STYLE: Record<DayStatus, { cls: string; label: string }> = {
  parfaite: { cls: 'bg-summit-success text-summit-bg', label: 'Parfaite' },
  joker: { cls: 'bg-summit-accent text-summit-bg', label: 'Joker utilisé' },
  faute: { cls: 'bg-summit-danger/80 text-white', label: 'Faute' },
  partielle: { cls: 'bg-summit-warn/70 text-summit-bg', label: "En cours" },
  vide: { cls: 'bg-summit-surface2/50 text-slate-500', label: 'Rien' },
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export default function History() {
  const today = todayKey()
  const logs = useAllLogs()

  if (!logs) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Chargement…</div>
  }

  const summary = computeStreak(logs, today)
  const statusByDate = new Map(summary.days.map((d) => [d.date, d.status]))

  // Grille des 5 dernières semaines, alignée au lundi.
  const todayDate = keyToDate(today)
  const offsetToMonday = (todayDate.getDay() + 6) % 7
  const lastMonday = addDays(today, -offsetToMonday)
  const gridStart = addDays(lastMonday, -7 * 4)

  const cells: { date: string; status: DayStatus; isFuture: boolean }[] = []
  for (let i = 0; i < 35; i++) {
    const date = addDays(gridStart, i)
    const isFuture = date > today
    cells.push({ date, status: statusByDate.get(date) ?? 'vide', isFuture })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Historique</h1>
        <p className="text-sm text-slate-400">Tes 5 dernières semaines.</p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Série max" value={`${summary.longestStreak} j`} emoji="🏔️" />
        <Stat label="Série actuelle" value={`${summary.currentStreak} j`} emoji="🔥" />
        <Stat
          label="Jours parfaits"
          value={String(summary.days.filter((d) => d.status === 'parfaite').length)}
          emoji="✅"
        />
        <Stat label="Jokers" value={String(summary.jokers)} emoji="🃏" />
      </section>

      <section>
        <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs text-slate-500">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell) => {
            const style = STATUS_STYLE[cell.status]
            const dayNum = keyToDate(cell.date).getDate()
            return (
              <div
                key={cell.date}
                title={`${prettyDate(cell.date)} — ${style.label}`}
                className={`flex aspect-square items-center justify-center rounded-lg text-xs font-medium ${
                  cell.isFuture ? 'bg-summit-surface/40 text-slate-600' : style.cls
                } ${cell.date === today ? 'ring-2 ring-white' : ''}`}
              >
                {dayNum}
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-1.5 text-xs text-slate-400">
        {(['parfaite', 'joker', 'faute', 'partielle'] as DayStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded ${STATUS_STYLE[s].cls}`} />
            {STATUS_STYLE[s].label}
          </div>
        ))}
      </section>
    </div>
  )
}

function Stat({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="rounded-xl border border-summit-surface2/60 bg-summit-surface p-3">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}
