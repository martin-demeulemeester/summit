// Configuration de la coach par exercice : seuils, posture, conseils.
// Pensé pour marcher de face comme de côté. Seuils centralisés ici (faciles à régler).

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

const PULLUP_POINTS = [POSE.nose, POSE.leftWrist, POSE.rightWrist, POSE.leftShoulder, POSE.rightShoulder]

function sidePts(lm: Landmark[]) {
  const i = bestArmSide(lm) === 'left'
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
  const s = sidePts(lm)
  return angle(s.shoulder, s.elbow, s.wrist)
}

/** Angle de la ligne du corps épaule-hanche-cheville (~180° si gainé). */
export function bodyLineAngle(lm: Landmark[]): number {
  const s = sidePts(lm)
  return angle(s.shoulder, s.hip, s.ankle)
}

/** Corps plutôt horizontal (planche / pompes vues de côté) ? Sert au feedback. */
export function isBodyHorizontal(lm: Landmark[]): boolean {
  const s = sidePts(lm)
  return Math.abs(s.shoulder.x - s.ankle.x) > Math.abs(s.shoulder.y - s.ankle.y) * 1.3
}

/** Corps plutôt vertical (suspension, tractions) ? */
export function isBodyVertical(lm: Landmark[]): boolean {
  const s = sidePts(lm)
  return Math.abs(s.shoulder.y - s.ankle.y) > Math.abs(s.shoulder.x - s.ankle.x) * 1.3
}

/** Poignets au-dessus des épaules (mains sur la barre, bras vers le haut). */
export function wristsAboveShoulders(lm: Landmark[]): boolean {
  const s = sidePts(lm)
  return s.wrist.y < s.shoulder.y // y croît vers le bas
}

/**
 * Écart vertical menton (nez) vs mains. Les mains tiennent la barre, donc c'est
 * un proxy de « menton au-dessus de la barre » (MediaPipe ne voit pas la barre).
 * Positif = nez SOUS les mains (suspension), négatif = menton au-dessus.
 */
export function chinAboveHandsGap(lm: Landmark[]): number {
  const wristY = (lm[POSE.leftWrist].y + lm[POSE.rightWrist].y) / 2
  return lm[POSE.nose].y - wristY
}

function backStraightFeedback(lm: Landmark[]): string[] {
  // Feedback de dos uniquement quand la vue de côté est exploitable.
  if (!isBodyHorizontal(lm)) return []
  return bodyLineAngle(lm) < 150 ? ['Garde le corps gainé, ne casse pas la ligne'] : []
}

function plankFeedback(lm: Landmark[]): string[] {
  if (!isBodyHorizontal(lm)) return ['Tiens la position 💪'] // de face : pas d'analyse de hanches fiable
  const s = sidePts(lm)
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
    minVisibility: 0.45,
    metric: elbowAngle,
    // Seuils assouplis : les reps rapides / moins amples comptent. Marche de face ou de côté.
    downThreshold: 110,
    upThreshold: 148,
    posture: backStraightFeedback,
  },
  tractions: {
    mode: 'reps',
    visibilityPoints: PULLUP_POINTS,
    minVisibility: 0.4,
    // Cycle suspension -> menton au niveau des mains (barre) -> suspension.
    metric: chinAboveHandsGap,
    downThreshold: 0.02, // menton atteint la hauteur des mains
    upThreshold: 0.1, // de retour en suspension complète
    ready: wristsAboveShoulders,
    readyHint: 'Attrape la barre : mains au-dessus de la tête, bras tendus',
  },
  gainage: {
    mode: 'hold',
    visibilityPoints: BODY_POINTS,
    minVisibility: 0.45,
    // Le chrono tourne dès que le corps est bien visible (de face comme de côté).
    inPosition: () => true,
    posture: plankFeedback,
  },
}

/** Conseils de placement caméra par exercice. */
export const COACH_META: Record<ExerciseId, { beta: boolean; tip: string }> = {
  pompes: { beta: false, tip: 'De face ou de côté, à ~2 m, épaules-coudes-poignets visibles.' },
  tractions: {
    beta: true,
    tip: 'Cadre de façon à voir tes mains sur la barre et ta tête. Le comptage se base sur le menton qui monte au niveau des mains.',
  },
  gainage: { beta: false, tip: 'Corps entier dans le cadre (de face ou de côté). Le chrono tourne tant que tu es visible.' },
}
