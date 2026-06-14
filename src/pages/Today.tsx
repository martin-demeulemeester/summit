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
      <header className="relative overflow-hidden rounded-[2rem] border-2 border-summit-line bg-summit-night p-5 text-summit-cream shadow-[8px_8px_0_rgba(31,25,19,0.18)]">
        <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full border-[18px] border-summit-accent/70" />
        <div className="absolute bottom-4 right-5 h-14 w-28 rotate-[-12deg] border-y-2 border-summit-cream/20" />
        <p className="summit-label text-summit-blush">{prettyDate(today)}</p>
        <h1 className="mt-3 font-display text-5xl font-black leading-none tracking-normal">Summit</h1>
        <p className="mt-3 max-w-[15rem] text-sm font-semibold text-summit-cream/75">
          Carnet d'ascension quotidien. Une trace nette, pas d'excuses.
        </p>
        <span className="summit-marker mt-5">Rituel du jour</span>
      </header>

      <StreakHeader currentStreak={currentStreak} jokers={jokers} />

      <section className="aura-card-soft p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-black uppercase tracking-wide text-summit-ink">Progression du jour</span>
          <span className="rounded-full bg-summit-night px-2 py-0.5 text-xs font-black text-summit-cream">
            {done} / {TOTAL_DAILY_ITEMS}
          </span>
        </div>
        <ProgressBar value={done} max={TOTAL_DAILY_ITEMS} />
      </section>

      <section className="space-y-2">
        <h2 className="summit-label">Tâches</h2>
        {DAILY_TASKS.map((task) => {
          const checked = log.tasks[task.id] === true
          return (
            <button
              key={task.id}
              onClick={() => toggleTask(today, task.id)}
              className={`group flex w-full items-center gap-3 rounded-[1.25rem] border-2 p-3 text-left transition-transform hover:-translate-y-0.5 ${
                checked
                  ? 'border-summit-line bg-summit-mint shadow-[5px_5px_0_rgba(63,125,58,0.20)]'
                  : 'border-summit-line bg-summit-surface shadow-[5px_5px_0_rgba(31,25,19,0.10)]'
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-summit-line bg-summit-paper text-2xl transition-transform group-hover:rotate-[-3deg]">
                {task.emoji}
              </span>
              <span className="flex-1">
                <span className={`block font-black ${checked ? 'text-summit-success' : 'text-summit-ink'}`}>
                  {task.label}
                </span>
                {task.description && <span className="text-xs font-medium text-summit-muted">{task.description}</span>}
              </span>
              <Checkbox checked={checked} />
            </button>
          )
        })}
      </section>

      <section>
        <h2 className="summit-label mb-2">Sport</h2>
        <div className="aura-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-black uppercase tracking-wide text-summit-ink">Blocs du jour</span>
            <span className="rounded-full bg-summit-cream px-2 py-0.5 text-sm font-black text-summit-ink">
              {sportDone} / {SPORT_BLOCKS_PER_DAY}
            </span>
          </div>
          <div className="mb-4 flex gap-2">
            {Array.from({ length: SPORT_BLOCKS_PER_DAY }).map((_, i) => (
              <div
                key={i}
                className={`h-4 flex-1 rounded-full border border-summit-line ${
                  i < sportDone ? 'bg-summit-accent' : 'bg-summit-surface2/80'
                }`}
              />
            ))}
          </div>
          <Link to="/sport" className="block aura-button-primary text-center">
            {sportDone >= SPORT_BLOCKS_PER_DAY ? 'Refaire un bloc' : 'Démarrer un bloc'}
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
        checked ? 'border-summit-line bg-summit-accent text-summit-night' : 'border-summit-line bg-summit-paper'
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
