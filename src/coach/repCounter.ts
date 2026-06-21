// Machines à états de comptage : répétitions (hystérésis sur un angle) et
// maintien (cumul de temps en position). Logique pure, testable sans caméra.

import { avgVisibility, type Landmark } from './geometry'

const LOW_VIS_FEEDBACK = 'Mets tout ton corps dans le cadre'

/** Les fonctions reçoivent les landmarks 2D et, si dispo, les world landmarks 3D. */
type LmFn<T> = (lm: Landmark[], world?: Landmark[]) => T

export interface RepConfig {
  mode: 'reps'
  visibilityPoints: number[]
  minVisibility: number
  /** Angle/valeur suivie (ex. coude). */
  metric: LmFn<number>
  /** Sous ce seuil = position basse. */
  downThreshold: number
  /** Au-dessus de ce seuil = position haute (fin de rep). */
  upThreshold: number
  posture?: LmFn<string[]>
  /** Position valide pour que les reps comptent (ex. corps à l'horizontale). */
  ready?: LmFn<boolean>
  /** Message affiché tant que la position n'est pas valide. */
  readyHint?: string
}

export interface HoldConfig {
  mode: 'hold'
  visibilityPoints: number[]
  minVisibility: number
  inPosition: LmFn<boolean>
  posture?: LmFn<string[]>
}

export type CoachConfig = RepConfig | HoldConfig

export interface RepUpdate {
  kind: 'reps'
  reps: number
  phase: 'up' | 'down'
  value: number
  feedback: string[]
  lowVisibility: boolean
}

export interface HoldUpdate {
  kind: 'hold'
  heldMs: number
  inPosition: boolean
  feedback: string[]
  lowVisibility: boolean
}

export type CoachUpdate = RepUpdate | HoldUpdate

export interface CoachCounter {
  update(landmarks: Landmark[], world?: Landmark[], dtMs?: number): CoachUpdate
  reset(): void
}

function createRepCounter(config: RepConfig): CoachCounter {
  let reps = 0
  let phase: 'up' | 'down' = 'up'

  return {
    update(lm, world) {
      const vis = avgVisibility(lm, config.visibilityPoints)
      if (vis < config.minVisibility) {
        return { kind: 'reps', reps, phase, value: NaN, feedback: [LOW_VIS_FEEDBACK], lowVisibility: true }
      }
      const value = config.metric(lm, world)
      // Tant que la position n'est pas valide, on ne compte pas (évite les
      // faux comptages debout, hors cadre, etc.).
      if (config.ready && !config.ready(lm, world)) {
        return {
          kind: 'reps',
          reps,
          phase,
          value,
          feedback: config.readyHint ? [config.readyHint] : [],
          lowVisibility: false,
        }
      }
      if (phase === 'up' && value < config.downThreshold) {
        phase = 'down'
      } else if (phase === 'down' && value > config.upThreshold) {
        phase = 'up'
        reps += 1
      }
      return { kind: 'reps', reps, phase, value, feedback: config.posture?.(lm, world) ?? [], lowVisibility: false }
    },
    reset() {
      reps = 0
      phase = 'up'
    },
  }
}

function createHoldCounter(config: HoldConfig): CoachCounter {
  let heldMs = 0

  return {
    update(lm, world, dtMs = 0) {
      const vis = avgVisibility(lm, config.visibilityPoints)
      if (vis < config.minVisibility) {
        return { kind: 'hold', heldMs, inPosition: false, feedback: [LOW_VIS_FEEDBACK], lowVisibility: true }
      }
      const inPosition = config.inPosition(lm, world)
      if (inPosition) heldMs += dtMs
      return { kind: 'hold', heldMs, inPosition, feedback: config.posture?.(lm, world) ?? [], lowVisibility: false }
    },
    reset() {
      heldMs = 0
    },
  }
}

/** Crée le compteur adapté au mode de la config. */
export function createCoachCounter(config: CoachConfig): CoachCounter {
  return config.mode === 'reps' ? createRepCounter(config) : createHoldCounter(config)
}
