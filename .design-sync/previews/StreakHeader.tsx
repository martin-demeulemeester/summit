import { StreakHeader } from 'summit'

export const SerieEnCours = () => (
  <div style={{ padding: 20, maxWidth: 380 }}>
    <StreakHeader currentStreak={12} jokers={2} />
  </div>
)

export const Debut = () => (
  <div style={{ padding: 20, maxWidth: 380 }}>
    <StreakHeader currentStreak={0} jokers={0} />
  </div>
)

export const LongueSerie = () => (
  <div style={{ padding: 20, maxWidth: 380 }}>
    <StreakHeader currentStreak={48} jokers={6} />
  </div>
)
