import { MOTTO } from '../domain/routine'

interface Props {
  currentStreak: number
  jokers: number
}

export default function StreakHeader({ currentStreak, jokers }: Props) {
  return (
    <div className="aura-card relative overflow-hidden p-4">
      <div className="absolute -left-8 top-4 h-28 w-28 rounded-full border-[14px] border-summit-accent/20" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="summit-label text-summit-accent">Altitude mentale</p>
          <p className="mt-1 font-display text-4xl font-black leading-none text-summit-ink">
            {currentStreak}
            <span className="ml-2 font-sans text-base font-black uppercase tracking-wide text-summit-muted">
              jour{currentStreak > 1 ? 's' : ''}
            </span>
          </p>
          <p className="mt-2 text-sm font-black uppercase tracking-wide text-summit-accent">{MOTTO}</p>
        </div>
        <div className="rotate-2 rounded-[1.25rem] border-2 border-summit-line bg-summit-cream px-3 py-2 text-center shadow-[4px_4px_0_rgba(31,25,19,0.16)]">
          <span className="block text-2xl">🃏</span>
          <span className="block text-lg font-black text-summit-ink">{jokers}</span>
          <span className="block text-[10px] font-black uppercase tracking-widest text-summit-muted">
            joker{jokers > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
