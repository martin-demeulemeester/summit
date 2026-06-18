// Géométrie de pose : indices des landmarks MediaPipe et calculs d'angles.
// Un landmark MediaPipe Pose est normalisé (x, y dans [0,1], origine en haut à gauche).

export interface Landmark {
  x: number
  y: number
  z?: number
  visibility?: number
}

/** Indices des 33 points du modèle MediaPipe Pose. */
export const POSE = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const

/** Angle (en degrés) au point b formé par les segments b->a et b->c, en 2D. */
export function angle(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const magAb = Math.hypot(abx, aby)
  const magCb = Math.hypot(cbx, cby)
  if (magAb === 0 || magCb === 0) return 0
  const cos = Math.min(1, Math.max(-1, dot / (magAb * magCb)))
  return (Math.acos(cos) * 180) / Math.PI
}

/** Visibilité moyenne (0..1) d'un groupe d'indices de landmarks. */
export function avgVisibility(landmarks: Landmark[], indices: number[]): number {
  if (indices.length === 0) return 0
  let sum = 0
  for (const i of indices) sum += landmarks[i]?.visibility ?? 0
  return sum / indices.length
}

/** Indique le côté (gauche/droite) le mieux visible pour une articulation bras. */
export function bestArmSide(landmarks: Landmark[]): 'left' | 'right' {
  const left = avgVisibility(landmarks, [POSE.leftShoulder, POSE.leftElbow, POSE.leftWrist])
  const right = avgVisibility(landmarks, [POSE.rightShoulder, POSE.rightElbow, POSE.rightWrist])
  return right > left ? 'right' : 'left'
}
