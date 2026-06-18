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

function side(lm: Landmark[]) {
  const s = bestArmSide(lm)
  const i = s === 'left'
  return {
    shoulder: lm[i ? POSE.leftShoulder : POSE.rightShoulder],
    elbow: lm[i ? POSE.leftElbow : POSE.rightElbow],
    wrist: lm[i ? POSE.leftWrist : POSE.rightWrist],
    hip: lm[i ? POSE.leftHip : POSE.rightHip],
    ankle: lm[i ? POSE.leftAnkle : POSE.rightAnkle],
  }
}

/** Angle du coude du côté le mieux visible (épaule-coude-poignet). */
export function elbowAngle(lm: Landmark[]): number {
  const s = side(lm)
  return angle(s.shoulder, s.elbow, s.wrist)
}

/** Angle de la ligne du corps épaule-hanche-cheville (~180° si gainé). */
export function bodyLineAngle(lm: Landmark[]): number {
  const s = side(lm)
  return angle(s.shoulder, s.hip, s.ankle)
}

/** Le corps est-il plutôt horizontal (pompes / planche vues de côté) ? */
export function isBodyHorizontal(lm: Landmark[]): boolean {
  const s = side(lm)
  const dx = Math.abs(s.shoulder.x - s.ankle.x)
  const dy = Math.abs(s.shoulder.y - s.ankle.y)
  return dx > dy * 1.3
}

/** Le corps est-il plutôt vertical (tractions, suspension) ? */
export function isBodyVertical(lm: Landmark[]): boolean {
  const s = side(lm)
  const dx = Math.abs(s.shoulder.x - s.ankle.x)
  const dy = Math.abs(s.shoulder.y - s.ankle.y)
  return dy > dx * 1.3
}

/** Poignets au-dessus des épaules (bras tendus vers le haut, barre). */
export function wristsAboveShoulders(lm: Landmark[]): boolean {
  const s = side(lm)
  return s.wrist.y < s.shoulder.y // y croît vers le bas
}

function backStraightFeedback(lm: Landmark[]): string[] {
  return bodyLineAngle(lm) < 152 ? ['Garde le corps gainé, ne casse pas la ligne'] : []
}

/** Feedback gainage : guide vers la position, puis aligne les hanches. */
function plankFeedback(lm: Landmark[]): string[] {
  if (!isBodyHorizontal(lm)) return ['Mets-toi en position de planche (corps à l’horizontale)']
  const s = side(lm)
  const expected = (s.shoulder.y + s.ankle.y) / 2
  const delta = s.hip.y - expected
  if (delta < -0.05) return ['Baisse un peu les hanches']
  if (delta > 0.05) return ['Relève les hanches, serre les fessiers']
  return ['Tiens la position 💪']
}

export const COACH_CONFIGS: Record<ExerciseId, CoachConfig> = {
  pompes: {
    mode: 'reps',
    visibilityPoints: ARM_POINTS,
    minVisibility: 0.5,
    metric: elbowAngle,
    downThreshold: 95,
    upThreshold: 155,
    ready: isBodyHorizontal,
    readyHint: 'Mets-toi en position de pompes (corps à l’horizontale)',
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
    ready: (lm) => isBodyVertical(lm) && wristsAboveShoulders(lm),
    readyHint: 'Suspends-toi à la barre, bras au-dessus de la tête',
  },
  gainage: {
    mode: 'hold',
    visibilityPoints: BODY_POINTS,
    minVisibility: 0.5,
    inPosition: (lm) => bodyLineAngle(lm) > 150 && isBodyHorizontal(lm),
    posture: plankFeedback,
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
