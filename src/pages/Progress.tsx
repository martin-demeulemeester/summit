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
    return <div className="flex h-64 items-center justify-center text-summit-muted">Chargement...</div>
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
        <h1 className="text-3xl font-extrabold text-summit-ink">Progression</h1>
        <p className="text-sm text-summit-muted">Tes cibles évoluent quand tu enchaînes les jours.</p>
      </header>

      <section className="space-y-3">
        {progressions.map((p) => {
          const def = exerciseById(p.exerciseId)
          const unit = def.unit === 'reps' ? 'reps' : 's'
          return (
            <div key={p.exerciseId} className="aura-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 font-bold text-summit-ink">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-summit-bg text-xl">
                    {def.emoji}
                  </span>
                  {def.label}
                </span>
                <span className="text-lg font-extrabold text-summit-accent">
                  {p.currentTarget} {unit}
                </span>
              </div>
              {p.ready ? (
                <div className="rounded-2xl bg-summit-mint p-3">
                  <p className="text-sm text-summit-success">
                    🎉 {p.daysDone} jours réussis ! Prêt à passer à{' '}
                    <strong>
                      {p.nextTarget} {unit}
                    </strong>{' '}
                    ?
                  </p>
                  <button
                    onClick={() => applyProgression(p.exerciseId)}
                    className="mt-2 w-full rounded-xl bg-summit-success py-2 text-sm font-semibold text-white"
                  >
                    Augmenter la cible
                  </button>
                </div>
              ) : (
                <>
                  <ProgressBar value={p.daysDone} max={p.threshold} />
                  <p className="mt-1.5 text-xs text-summit-muted">
                    {p.daysDone} / {p.threshold} jours de sport complets vers {p.nextTarget} {unit}
                  </p>
                </>
              )}
            </div>
          )
        })}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-summit-muted">14 derniers jours</h2>
        <div className="aura-card p-3">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7ddf7" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#776b86', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                domain={[0, TOTAL_DAILY_ITEMS]}
                tick={{ fill: '#776b86', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #ddd2ef', borderRadius: 12, color: '#241344' }}
                labelStyle={{ color: '#776b86' }}
                formatter={(v: number) => [`${v} / ${TOTAL_DAILY_ITEMS}`, 'Complété']}
              />
              <Bar dataKey="done" fill="#7c3aed" radius={[6, 6, 0, 0]} />
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
