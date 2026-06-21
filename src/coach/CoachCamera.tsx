import { useEffect, useRef, useState } from 'react'
import type { ExerciseId } from '../domain/routine'
import { formatDuration } from '../lib/date'
import { COACH_CONFIGS } from './exercises'
import { createCoachCounter, type CoachUpdate } from './repCounter'
import { getPoseLandmarker, PoseLandmarker } from './poseLandmarker'
import type { Landmark } from './geometry'

type Status = 'loading' | 'ready' | 'error'

interface Props {
  exerciseId: ExerciseId
  target: number
  /** Appelé une seule fois quand la cible est atteinte (reps ou maintien). */
  onComplete: () => void
  /** Échappatoire affichée UNIQUEMENT si la caméra est indisponible. */
  onManualSkip?: () => void
}

/**
 * Caméra + détection de pose + comptage en direct. La validation ne se fait
 * qu'en réalisant réellement l'effort (pas de bouton de validation gratuit).
 */
export default function CoachCamera({ exerciseId, target, onComplete, onManualSkip }: Props) {
  const config = COACH_CONFIGS[exerciseId]
  const isHold = config.mode === 'hold'

  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [live, setLive] = useState<CoachUpdate | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const targetRef = useRef(target)
  targetRef.current = target

  useEffect(() => {
    let cancelled = false
    let raf = 0
    let stream: MediaStream | null = null
    const counter = createCoachCounter(COACH_CONFIGS[exerciseId])
    let lastTs = performance.now()
    completedRef.current = false
    setStatus('loading')
    setLive(null)

    async function run() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false })
        if (cancelled) return
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        const landmarker = await getPoseLandmarker()
        if (cancelled) return
        setStatus('ready')

        const loop = () => {
          if (cancelled) return
          const v = videoRef.current
          if (v && v.readyState >= 2) {
            const now = performance.now()
            const dt = now - lastTs
            lastTs = now
            const result = landmarker.detectForVideo(v, now)
            const lm = result.landmarks?.[0] as Landmark[] | undefined
            const world = result.worldLandmarks?.[0] as Landmark[] | undefined
            if (lm) {
              const upd = counter.update(lm, world, dt)
              setLive(upd)
              drawSkeleton(canvasRef.current, v, result.landmarks?.[0], facing === 'user')
              const reached =
                (upd.kind === 'reps' && upd.reps >= targetRef.current) ||
                (upd.kind === 'hold' && upd.heldMs >= targetRef.current * 1000)
              if (reached && !completedRef.current) {
                completedRef.current = true
                stream?.getTracks().forEach((t) => t.stop())
                onCompleteRef.current()
                return
              }
            } else {
              clearCanvas(canvasRef.current)
            }
          }
          raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setErrorMsg(humanizeError(err))
        }
      }
    }

    run()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [facing, exerciseId])

  const reps = live?.kind === 'reps' ? live.reps : 0
  const heldS = live?.kind === 'hold' ? Math.floor(live.heldMs / 1000) : 0
  const feedback = live?.feedback ?? []

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[1.6rem] border-2 border-summit-line bg-summit-night shadow-[8px_8px_0_rgba(31,25,19,0.18)]">
        <video ref={videoRef} playsInline muted className={`block w-full ${facing === 'user' ? '-scale-x-100' : ''}`} />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

        <div className="absolute left-3 top-3 rounded-2xl border-2 border-summit-line bg-summit-paper/95 px-4 py-2 text-center">
          {isHold ? (
            <>
              <div className="font-mono text-3xl font-black text-summit-accent">{formatDuration(heldS)}</div>
              <div className="summit-label">/ {formatDuration(target)}</div>
            </>
          ) : (
            <>
              <div className="font-display text-4xl font-black leading-none text-summit-accent">
                {reps}
                <span className="text-xl text-summit-muted"> / {target}</span>
              </div>
              <div className="summit-label">reps</div>
            </>
          )}
        </div>

        {status !== 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-summit-night/85 p-6 text-center">
            <p className="text-sm font-bold text-summit-cream">
              {status === 'loading' && 'Initialisation de la caméra et du modèle...'}
              {status === 'error' && errorMsg}
            </p>
            {status === 'error' && onManualSkip && (
              <button
                onClick={onManualSkip}
                className="rounded-xl border-2 border-summit-cream/40 px-4 py-2 text-xs font-black uppercase tracking-wide text-summit-cream"
              >
                Caméra indisponible : valider sans caméra
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-[2.25rem] flex-wrap gap-2">
        {feedback.map((f) => (
          <span
            key={f}
            className="rounded-full border-2 border-summit-line bg-summit-cream px-3 py-1 text-xs font-bold text-summit-ink"
          >
            ⚠️ {f}
          </span>
        ))}
      </div>

      <button
        onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
        className="w-full rounded-2xl border-2 border-summit-line bg-summit-surface py-2.5 text-sm font-black uppercase tracking-wide text-summit-ink"
      >
        🔄 Changer de caméra
      </button>
    </div>
  )
}

// --- Dessin du squelette --------------------------------------------------

function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return
  canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
}

function drawSkeleton(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  landmarks: Landmark[] | undefined,
  mirror: boolean,
) {
  if (!canvas || !landmarks) return
  const w = video.videoWidth
  const h = video.videoHeight
  if (w === 0 || h === 0) return
  if (canvas.width !== w) canvas.width = w
  if (canvas.height !== h) canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  if (mirror) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.strokeStyle = '#ff5a1f'
  ctx.lineWidth = Math.max(2, w / 220)
  for (const conn of PoseLandmarker.POSE_CONNECTIONS) {
    const a = landmarks[conn.start]
    const b = landmarks[conn.end]
    if (!a || !b) continue
    ctx.beginPath()
    ctx.moveTo(a.x * w, a.y * h)
    ctx.lineTo(b.x * w, b.y * h)
    ctx.stroke()
  }
  ctx.fillStyle = '#fffaf0'
  const r = Math.max(3, w / 160)
  for (const p of landmarks) {
    if ((p.visibility ?? 0) < 0.3) continue
    ctx.beginPath()
    ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function humanizeError(err: unknown): string {
  const name = (err as { name?: string })?.name
  if (name === 'NotAllowedError') return 'Accès caméra refusé. Autorise la caméra dans ton navigateur.'
  if (name === 'NotFoundError') return 'Aucune caméra détectée sur cet appareil.'
  return `Erreur caméra : ${(err as Error)?.message ?? 'inconnue'}`
}
