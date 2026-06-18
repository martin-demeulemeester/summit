// Chargement (singleton) du modèle MediaPipe PoseLandmarker.
// WASM + modèle servis depuis CDN ; chargés à la première ouverture de la coach.

import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'

let landmarkerPromise: Promise<PoseLandmarker> | null = null

/** Récupère (et charge au besoin) l'instance PoseLandmarker en mode vidéo. */
export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
      return PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
    })().catch((err) => {
      // Permet de réessayer après un échec (réseau, etc.).
      landmarkerPromise = null
      throw err
    })
  }
  return landmarkerPromise
}

export { PoseLandmarker }
