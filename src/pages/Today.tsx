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
      <header className="rounded-[1.75rem] bg-summit-bg/80 pb-1 pt-2">
        <p className="text-sm font-semibold capitalize text-summit-muted">{prettyDate(today)}</p>
        <h1 className="text-4xl font-extrabold tracking-normal text-summit-accent">Summit</h1>
        <p className="mt-1 text-sm text-summit-muted">Ton coach discret pour tenir la journée.</p>
      </header>

      <StreakHeader currentStreak={currentStreak} jokers={jokers} />

      <section className="aura-card-soft p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-summit-ink">Progression du jour</span>
          <span className="font-semibold text-summit-muted">
            {done} / {TOTAL_DAILY_ITEMS}
          </span>
        </div>
        <ProgressBar value={done} max={TOTAL_DAILY_ITEMS} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-summit-muted">Tâches</h2>
        {DAILY_TASKS.map((task) => {
          const checked = log.tasks[task.id] === true
          return (
            <button
              key={task.id}
              onClick={() => toggleTask(today, task.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-[0_10px_24px_rgba(57,31,91,0.06)] transition-colors ${
                checked
                  ? 'border-summit-success/30 bg-summit-mint'
                  : 'border-summit-line/80 bg-white hover:border-summit-accent/40'
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-summit-bg text-2xl">
                {task.emoji}
              </span>
              <span className="flex-1">
                <span className={`block font-bold ${checked ? 'text-summit-success' : 'text-summit-ink'}`}>
                  {task.label}
                </span>
                {task.description && <span className="text-xs text-summit-muted">{task.description}</span>}
              </span>
              <Checkbox checked={checked} />
            </button>
          )
        })}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-summit-muted">Sport</h2>
        <div className="aura-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-bold text-summit-ink">Blocs du jour</span>
            <span className="text-sm font-semibold text-summit-muted">
              {sportDone} / {SPORT_BLOCKS_PER_DAY}
            </span>
          </div>
          <div className="mb-4 flex gap-2">
            {Array.from({ length: SPORT_BLOCKS_PER_DAY }).map((_, i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-full ${
                  i < sportDone ? 'bg-summit-accent' : 'bg-summit-surface2/80'
                }`}
              />
            ))}
          </div>
          <Link to="/sport" className="block aura-button-primary text-center">
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
        checked ? 'border-summit-success bg-summit-success text-white' : 'border-summit-line bg-white'
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
  return <div className="flex h-64 items-center justify-center text-summit-muted">Chargement...</div>
}
