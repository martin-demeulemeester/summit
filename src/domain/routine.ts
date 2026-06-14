// Définition statique de la routine Summit.
// Source de vérité pour les tâches quotidiennes et les exercices de sport.

export type TaskId = 'visage_matin' | 'visage_soir' | 'pied' | 'dev' | 'prepa'

export type Period = 'matin' | 'soir' | 'journee'

export interface TaskDef {
  id: TaskId
  label: string
  emoji: string
  description?: string
  period: Period
  /** Heure de rappel par défaut, format HH:MM. */
  defaultReminder: string
}

/** Les tâches non sportives à cocher chaque jour. */
export const DAILY_TASKS: TaskDef[] = [
  {
    id: 'visage_matin',
    label: 'Soin visage (matin)',
    emoji: '🧴',
    period: 'matin',
    defaultReminder: '08:00',
  },
  {
    id: 'dev',
    label: '1 h de dev',
    emoji: '💻',
    description: 'Une heure de code.',
    period: 'journee',
    defaultReminder: '14:00',
  },
  {
    id: 'prepa',
    label: '1 h de prépa MP2I',
    emoji: '📐',
    description: 'Maths / physique.',
    period: 'journee',
    defaultReminder: '16:00',
  },
  {
    id: 'visage_soir',
    label: 'Soin visage (soir)',
    emoji: '🌙',
    period: 'soir',
    defaultReminder: '21:30',
  },
  {
    id: 'pied',
    label: 'Soin des pieds',
    emoji: '🦶',
    period: 'soir',
    defaultReminder: '21:30',
  },
]

export type ExerciseId = 'tractions' | 'pompes' | 'gainage'

export type ExerciseUnit = 'reps' | 'secondes'

export interface ExerciseDef {
  id: ExerciseId
  label: string
  emoji: string
  unit: ExerciseUnit
  /** Cible de départ. */
  initialTarget: number
  /** Incrément proposé lors d'une progression. */
  increment: number
}

/** Les exercices d'un bloc de sport, dans l'ordre. */
export const EXERCISES: ExerciseDef[] = [
  { id: 'tractions', label: 'Tractions', emoji: '🧗', unit: 'reps', initialTarget: 5, increment: 1 },
  { id: 'pompes', label: 'Pompes', emoji: '💪', unit: 'reps', initialTarget: 10, increment: 2 },
  { id: 'gainage', label: 'Gainage', emoji: '🪵', unit: 'secondes', initialTarget: 90, increment: 15 },
]

/** Nombre de blocs de sport à réaliser dans la journée. */
export const SPORT_BLOCKS_PER_DAY = 4

/** Repos entre les exercices d'un bloc (secondes). */
export const REST_SECONDS = 60

/** Nombre de jours réussis consécutifs avant de proposer une progression. */
export const PROGRESSION_THRESHOLD_DAYS = 7

/** Devise de l'application. */
export const MOTTO = 'Stay Strong!'

export function exerciseById(id: ExerciseId): ExerciseDef {
  const ex = EXERCISES.find((e) => e.id === id)
  if (!ex) throw new Error(`Exercice inconnu : ${id}`)
  return ex
}

export function taskById(id: TaskId): TaskDef {
  const t = DAILY_TASKS.find((x) => x.id === id)
  if (!t) throw new Error(`Tâche inconnue : ${id}`)
  return t
}
