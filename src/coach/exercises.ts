// Configuration de la coach par exercice : seuils d'angles, posture, conseils.
// Les seuils sont centralisés ici pour être ajustés facilement.

import { POSE, angle, bestArmSide, type Landmark } from './geometry'
import type { CoachConfig } from './repCounter'
import type { ExerciseId } from '../domain/routine'

const ARM_POINTS = [
  POSE.leftShoulder,
  POSE.rightShoulder,
  POSE.leftElbow,
  POSE.rightElbow,
  POSE.leftWrist,
  POSE.rightWrist,
]

const BODY_POINTS = [POSE.leftShoulder, POSE.rightShoulder, POSE.leftHip, POSE.rightHip, POSE.leftAnkle, POSE.rightAnkle]

/** Angle du coude du côté le mieux visible (épaule-coude-poignet). */
export function elbowAngle(lm: Landmark[]): number {
  if (bestArmSide(lm) === 'left') {
    return angle(lm[POSE.leftShoulder], lm[POSE.leftElbow], lm[POSE.leftWrist])
  }
  return angle(lm[POSE.rightShoulder], lm[POSE.rightElbow], lm[POSE.rightWrist])
}

/** Angle de la ligne du corps épaule-hanche-cheville (~180° si gainé). */
export function bodyLineAngle(lm: Landmark[]): number {
  if (bestArmSide(lm) === 'left') {
    return angle(lm[POSE.leftShoulder], lm[POSE.leftHip], lm[POSE.leftAnkle])
  }
  return angle(lm[POSE.rightShoulder], lm[POSE.rightHip], lm[POSE.rightAnkle])
}

function backStraightFeedback(lm: Landmark[]): string[] {
  return bodyLineAngle(lm) < 152 ? ['Garde le corps gainé, ne casse pas la ligne'] : []
}

/** Feedback d'alignement des hanches en planche (y croît vers le bas). */
function plankHipFeedback(lm: Landmark[]): string[] {
  const side = bestArmSide(lm)
  const shoulder = lm[side === 'left' ? POSE.leftShoulder : POSE.rightShoulder]
  const hip = lm[side === 'left' ? POSE.leftHip : POSE.rightHip]
  const ankle = lm[side === 'left' ? POSE.leftAnkle : POSE.rightAnkle]
  const expected = (shoulder.y + ankle.y) / 2
  const delta = hip.y - expected
  if (delta < -0.05) return ['Baisse un peu les hanches']
  if (delta > 0.05) return ['Relève les hanches, serre les fessiers']
  return []
}

export const COACH_CONFIGS: Record<ExerciseId, CoachConfig> = {
  pompes: {
    mode: 'reps',
    visibilityPoints: ARM_POINTS,
    minVisibility: 0.5,
    metric: elbowAngle,
    downThreshold: 95,
    upThreshold: 155,
    posture: backStraightFeedback,
  },
  tractions: {
    mode: 'reps',
    visibilityPoints: ARM_POINTS,
    minVisibility: 0.5,
    metric: elbowAngle,
    // Bas = bras tendus (grand angle), haut = bras fléchis (petit angle).
    downThreshold: 75,
    upThreshold: 155,
  },
  gainage: {
    mode: 'hold',
    visibilityPoints: BODY_POINTS,
    minVisibility: 0.5,
    inPosition: (lm) => bodyLineAngle(lm) > 150,
    posture: plankHipFeedback,
  },
}

/** Conseils de placement caméra + statut beta par exercice. */
export const COACH_META: Record<ExerciseId, { beta: boolean; tip: string }> = {
  pompes: { beta: false, tip: 'Pose le téléphone au sol, de côté, à ~2 m. Tout le corps doit être visible.' },
  tractions: {
    beta: true,
    tip: 'Détection moins fiable. Cadre de côté pour voir un bras complet (épaule, coude, poignet).',
  },
  gainage: { beta: false, tip: 'Téléphone de côté à ~2 m, corps entier dans le cadre.' },
}
