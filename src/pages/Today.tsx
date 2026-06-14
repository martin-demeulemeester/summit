import { Link } from 'react-router-dom'
import { useAllLogs, useLog } from '../db/hooks'
import { toggleTask } from '../db/db'
import { DAILY_TASKS, SPORT_BLOCKS_PER_DAY } from '../domain/routine'
import { computeStreak, dayDoneCount, TOTAL_DAILY_ITEMS } from '../domain/streak'
import { prettyDate, todayKey } from '../lib/date'
import StreakHeader from '../components/StreakHeader'
import ProgressBar from '../components/ProgressBar'

export default function Today() {
  const today = todayKey()
  const log = useLog(today)
  const logs = useAllLogs()

  if (!log || !logs) return <LoadingState />

  const { currentStreak, jokers } = computeStreak(logs, today)
  const done = dayDoneCount(log)
  const sportDone = Math.min(log.sportBlocks ?? 0, SPORT_BLOCKS_PER_DAY)

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-white">Aujourd'hui</h1>
        <p className="text-sm capitalize text-slate-400">{prettyDate(today)}</p>
      </header>

      <StreakHeader currentStreak={currentStreak} jokers={jokers} />

      <section>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-300">Progression du jour</span>
          <span className="text-slate-400">
            {done} / {TOTAL_DAILY_ITEMS}
          </span>
        </div>
        <ProgressBar value={done} max={TOTAL_DAILY_ITEMS} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Tâches
        </h2>
        {DAILY_TASKS.map((task) => {
          const checked = log.tasks[task.id] === true
          return (
            <button
              key={task.id}
              onClick={() => toggleTask(today, task.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                checked
                  ? 'border-summit-success/40 bg-summit-success/10'
                  : 'border-summit-surface2/60 bg-summit-surface hover:border-summit-surface2'
              }`}
            >
              <span className="text-2xl">{task.emoji}</span>
              <span className="flex-1">
                <span className={`block font-medium ${checked ? 'text-summit-success' : 'text-white'}`}>
                  {task.label}
                </span>
                {task.description && (
                  <span className="text-xs text-slate-400">{task.description}</span>
                )}
              </span>
              <Checkbox checked={checked} />
            </button>
          )
        })}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Sport
        </h2>
        <div className="rounded-xl border border-summit-surface2/60 bg-summit-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium text-white">Blocs du jour</span>
            <span className="text-sm text-slate-400">
              {sportDone} / {SPORT_BLOCKS_PER_DAY}
            </span>
          </div>
          <div className="mb-4 flex gap-2">
            {Array.from({ length: SPORT_BLOCKS_PER_DAY }).map((_, i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-full ${
                  i < sportDone ? 'bg-summit-success' : 'bg-summit-surface2'
                }`}
              />
            ))}
          </div>
          <Link
            to="/sport"
            className="block rounded-xl bg-summit-accent py-3 text-center font-semibold text-summit-bg transition-opacity hover:opacity-90"
          >
            {sportDone >= SPORT_BLOCKS_PER_DAY ? 'Refaire un bloc 💪' : 'Démarrer un bloc 💪'}
          </Link>
        </div>
      </section>
    </div>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
        checked
          ? 'border-summit-success bg-summit-success text-summit-bg'
          : 'border-slate-500'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </span>
  )
}

function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center text-slate-500">
      Chargement…
    </div>
  )
}
