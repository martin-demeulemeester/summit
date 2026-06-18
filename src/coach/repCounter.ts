// Machines à états de comptage : répétitions (hystérésis sur un angle) et
// maintien (cumul de temps en position). Logique pure, testable sans caméra.

import { avgVisibility, type Landmark } from './geometry'

const LOW_VIS_FEEDBACK = 'Mets tout ton corps dans le cadre'

export interface RepConfig {
  mode: 'reps'
  visibilityPoints: number[]
  minVisibility: number
  /** Angle suivi (ex. coude). */
  metric: (lm: Landmark[]) => number
  /** Sous ce seuil = position basse. */
  downThreshold: number
  /** Au-dessus de ce seuil = position haute (fin de rep). */
  upThreshold: number
  posture?: (lm: Landmark[]) => string[]
}

export interface HoldConfig {
  mode: 'hold'
  visibilityPoints: number[]
  minVisibility: number
  inPosition: (lm: Landmark[]) => boolean
  posture?: (lm: Landmark[]) => string[]
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
  update(landmarks: Landmark[], dtMs?: number): CoachUpdate
  reset(): void
}

function createRepCounter(config: RepConfig): CoachCounter {
  let reps = 0
  let phase: 'up' | 'down' = 'up'

  return {
    update(lm) {
      const vis = avgVisibility(lm, config.visibilityPoints)
      if (vis < config.minVisibility) {
        return { kind: 'reps', reps, phase, value: NaN, feedback: [LOW_VIS_FEEDBACK], lowVisibility: true }
      }
      const value = config.metric(lm)
      if (phase === 'up' && value < config.downThreshold) {
        phase = 'down'
      } else if (phase === 'down' && value > config.upThreshold) {
        phase = 'up'
        reps += 1
      }
      return { kind: 'reps', reps, phase, value, feedback: config.posture?.(lm) ?? [], lowVisibility: false }
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
    update(lm, dtMs = 0) {
      const vis = avgVisibility(lm, config.visibilityPoints)
      if (vis < config.minVisibility) {
        return { kind: 'hold', heldMs, inPosition: false, feedback: [LOW_VIS_FEEDBACK], lowVisibility: true }
      }
      const inPosition = config.inPosition(lm)
      if (inPosition) heldMs += dtMs
      return { kind: 'hold', heldMs, inPosition, feedback: config.posture?.(lm) ?? [], lowVisibility: false }
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
