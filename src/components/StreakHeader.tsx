import { MOTTO } from '../domain/routine'

interface Props {
  currentStreak: number
  jokers: number
}

export default function StreakHeader({ currentStreak, jokers }: Props) {
  return (
    <div className="aura-card overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-summit-accent">Série en cours</p>
          <p className="text-3xl font-bold text-summit-ink">
            {currentStreak}
            <span className="ml-1 text-base font-semibold text-summit-muted">
              jour{currentStreak > 1 ? 's' : ''} 🔥
            </span>
          </p>
          <p className="mt-1 text-sm font-semibold text-summit-accent">{MOTTO}</p>
        </div>
        <div className="flex flex-col items-center rounded-2xl bg-summit-cream px-3 py-2 ring-1 ring-summit-line/70">
          <span className="text-2xl">🃏</span>
          <span className="text-lg font-bold text-summit-ink">{jokers}</span>
          <span className="text-[10px] font-bold uppercase text-summit-muted">
            joker{jokers > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
