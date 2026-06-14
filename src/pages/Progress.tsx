import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAllLogs, useSettings } from '../db/hooks'
import { saveSettings } from '../db/db'
import { allProgressions } from '../domain/progression'
import { exerciseById } from '../domain/routine'
import { dayDoneCount, TOTAL_DAILY_ITEMS } from '../domain/streak'
import { addDays, todayKey } from '../lib/date'
import ProgressBar from '../components/ProgressBar'
import type { DailyLog, Settings } from '../domain/types'
import type { ExerciseId } from '../domain/routine'

export default function Progress() {
  const today = todayKey()
  const settings = useSettings()
  const logs = useAllLogs()

  if (!settings || !logs) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Chargement…</div>
  }

  const progressions = allProgressions(logs, settings, today)
  const chartData = buildChartData(logs, today)

  async function applyProgression(ex: ExerciseId) {
    const def = exerciseById(ex)
    const next: Settings = {
      ...settings!,
      targets: { ...settings!.targets, [ex]: settings!.targets[ex] + def.increment },
      targetSince: { ...settings!.targetSince, [ex]: today },
    }
    await saveSettings(next)
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Progression</h1>
        <p className="text-sm text-slate-400">Tes cibles évoluent quand tu enchaînes les jours.</p>
      </header>

      <section className="space-y-3">
        {progressions.map((p) => {
          const def = exerciseById(p.exerciseId)
          const unit = def.unit === 'reps' ? 'reps' : 's'
          return (
            <div key={p.exerciseId} className="rounded-xl border border-summit-surface2/60 bg-summit-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium text-white">
                  <span className="text-xl">{def.emoji}</span>
                  {def.label}
                </span>
                <span className="text-lg font-bold text-summit-accent">
                  {p.currentTarget} {unit}
                </span>
              </div>
              {p.ready ? (
                <div className="rounded-lg bg-summit-success/10 p-3">
                  <p className="text-sm text-summit-success">
                    🎉 {p.daysDone} jours réussis ! Prêt à passer à{' '}
                    <strong>
                      {p.nextTarget} {unit}
                    </strong>{' '}
                    ?
                  </p>
                  <button
                    onClick={() => applyProgression(p.exerciseId)}
                    className="mt-2 w-full rounded-lg bg-summit-success py-2 text-sm font-semibold text-summit-bg"
                  >
                    Augmenter la cible
                  </button>
                </div>
              ) : (
                <>
                  <ProgressBar value={p.daysDone} max={p.threshold} />
                  <p className="mt-1.5 text-xs text-slate-400">
                    {p.daysDone} / {p.threshold} jours de sport complets vers{' '}
                    {p.nextTarget} {unit}
                  </p>
                </>
              )}
            </div>
          )
        })}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          14 derniers jours
        </h2>
        <div className="rounded-xl border border-summit-surface2/60 bg-summit-surface p-3">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, TOTAL_DAILY_ITEMS]}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8' }}
                formatter={(v: number) => [`${v} / ${TOTAL_DAILY_ITEMS}`, 'Complété']}
              />
              <Bar dataKey="done" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

function buildChartData(logs: DailyLog[], today: string) {
  const byDate = new Map(logs.map((l) => [l.date, l]))
  const data: { label: string; done: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const date = addDays(today, -i)
    data.push({
      label: date.slice(8, 10),
      done: dayDoneCount(byDate.get(date)),
    })
  }
  return data
}
