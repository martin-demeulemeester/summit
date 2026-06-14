import type { ExerciseId, TaskId } from './routine'

/** Une entrée par jour : ce qui a été coché. */
export interface DailyLog {
  /** Clé YYYY-MM-DD (clé primaire). */
  date: string
  /** Tâches quotidiennes cochées. */
  tasks: Partial<Record<TaskId, boolean>>
  /** Nombre de blocs de sport complétés (0 à SPORT_BLOCKS_PER_DAY). */
  sportBlocks: number
  /** Timestamp de la dernière modification (pour la synchro cloud). */
  updatedAt: number
}

/** Cibles courantes pour chaque exercice. */
export type ExerciseTargets = Record<ExerciseId, number>

/** Réglages des rappels. */
export interface ReminderSettings {
  enabled: boolean
  /** Heure de rappel par tâche, format HH:MM. */
  times: Partial<Record<TaskId, string>>
  /** Heure de relance du sport en fin de journée s'il reste des blocs. */
  sportEndOfDay: string
}

/** Réglages applicatifs (singleton). */
export interface Settings {
  id: 'app'
  targets: ExerciseTargets
  reminders: ReminderSettings
  /** Date (YYYY-MM-DD) à laquelle la cible courante a été fixée, par exercice.
   * Sert à compter les jours réussis depuis ce palier. */
  targetSince: Record<ExerciseId, string>
  /** Timestamp de dernière modification (résolution de conflits cloud). */
  updatedAt: number
}

export type DayStatus = 'parfaite' | 'joker' | 'faute' | 'partielle' | 'vide'

export interface DayEvaluation {
  date: string
  status: DayStatus
}

export interface StreakSummary {
  /** Streak courant (jours parfaits ou couverts par un joker, jusqu'à aujourd'hui). */
  currentStreak: number
  /** Plus longue série atteinte. */
  longestStreak: number
  /** Solde de jokers disponibles. */
  jokers: number
  /** Évaluation jour par jour (chronologique). */
  days: DayEvaluation[]
}
