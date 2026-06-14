import { MOTTO } from '../domain/routine'

interface Props {
  currentStreak: number
  jokers: number
}

export default function StreakHeader({ currentStreak, jokers }: Props) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-summit-surface to-summit-surface2 p-4 shadow-lg">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Série en cours</p>
        <p className="text-3xl font-bold text-white">
          {currentStreak}
          <span className="ml-1 text-base font-medium text-slate-300">
            jour{currentStreak > 1 ? 's' : ''} 🔥
          </span>
        </p>
        <p className="mt-1 text-sm font-semibold text-summit-accent">{MOTTO}</p>
      </div>
      <div className="flex flex-col items-center rounded-xl bg-summit-bg/40 px-3 py-2">
        <span className="text-2xl">🃏</span>
        <span className="text-lg font-bold text-white">{jokers}</span>
        <span className="text-[10px] uppercase text-slate-400">joker{jokers > 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
