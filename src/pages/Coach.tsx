import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../db/hooks'
import { addSportBlock } from '../db/db'
import { EXERCISES, SPORT_BLOCKS_PER_DAY, exerciseById, type ExerciseId } from '../domain/routine'
import { formatDuration, todayKey } from '../lib/date'
import { COACH_CONFIGS, COACH_META } from '../coach/exercises'
import { createCoachCounter, type CoachUpdate } from '../coach/repCounter'
import { getPoseLandmarker, PoseLandmarker } from '../coach/poseLandmarker'
import type { Landmark } from '../coach/geometry'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export default function Coach() {
  const settings = useSettings()
  const navigate = useNavigate()

  const [exerciseId, setExerciseId] = useState<ExerciseId>('pompes')
  const [started, setStarted] = useState(false)
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [live, setLive] = useState<CoachUpdate | null>(null)
  const [done, setDone] = useState(false)
  const [saved, setSaved] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const config = COACH_CONFIGS[exerciseId]
  const def = exerciseById(exerciseId)
  const target = settings?.targets[exerciseId] ?? def.initialTarget
  const isHold = config.mode === 'hold'

  // Refs lues dans la boucle d'animation (valeurs à jour sans relancer l'effet).
  const targetRef = useRef(target)
  targetRef.current = target
  const configRef = useRef(config)
  configRef.current = config

  useEffect(() => {
    if (!started) return
    let cancelled = false
    let finished = false
    let raf = 0
    let stream: MediaStream | null = null
    const counter = createCoachCounter(configRef.current)
    let lastTs = performance.now()
    setDone(false)
    setSaved(false)
    setLive(null)

    async function run() {
      try {
        setStatus('loading')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        })
        if (cancelled) return
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()
        const landmarker = await getPoseLandmarker()
        if (cancelled) return
        setStatus('ready')

        const loop = () => {
          if (cancelled || finished) return
          const v = videoRef.current
          if (v && v.readyState >= 2) {
            const now = performance.now()
            const dt = now - lastTs
            lastTs = now
            const result = landmarker.detectForVideo(v, now)
            const lm = result.landmarks?.[0] as Landmark[] | undefined
            if (lm) {
              const upd = counter.update(lm, dt)
              setLive(upd)
              drawSkeleton(canvasRef.current, v, result.landmarks?.[0], facing === 'user')
              const reached =
                (upd.kind === 'reps' && upd.reps >= targetRef.current) ||
                (upd.kind === 'hold' && upd.heldMs >= targetRef.current * 1000)
              if (reached) {
                finished = true
                setDone(true)
                stream?.getTracks().forEach((t) => t.stop())
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
  }, [started, facing])

  function stop() {
    setStarted(false)
    setStatus('idle')
    setLive(null)
    setDone(false)
  }

  async function validateBlock() {
    await addSportBlock(todayKey())
    setSaved(true)
  }

  // --- Écran de sélection ---
  if (!started) {
    return (
      <div className="space-y-5">
        <header>
          <p className="summit-label">Coach caméra · beta</p>
          <h1 className="font-display text-4xl font-black text-summit-ink">Coach</h1>
          <p className="mt-1 text-sm font-medium text-summit-muted">
            Tout est analysé sur ton téléphone. Aucune vidéo n'est envoyée.
          </p>
        </header>

        <section className="space-y-2">
          <h2 className="summit-label">Exercice</h2>
          {EXERCISES.map((ex) => {
            const meta = COACH_META[ex.id]
            const active = ex.id === exerciseId
            return (
              <button
                key={ex.id}
                onClick={() => setExerciseId(ex.id)}
                className={`flex w-full items-center gap-3 rounded-[1.25rem] border-2 p-3 text-left transition-transform ${
                  active
                    ? 'border-summit-line bg-summit-accent text-summit-night shadow-[5px_5px_0_rgba(31,25,19,0.18)]'
                    : 'border-summit-line bg-summit-surface text-summit-ink'
                }`}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-summit-line bg-summit-paper text-2xl">
                  {ex.emoji}
                </span>
                <span className="flex-1">
                  <span className="block font-black">
                    {ex.label}
                    {meta.beta && <span className="ml-2 text-[10px] font-black uppercase opacity-70">beta</span>}
                  </span>
                  <span className={`text-xs ${active ? 'text-summit-night/70' : 'text-summit-muted'}`}>
                    Cible : {settings?.targets[ex.id] ?? ex.initialTarget} {ex.unit === 'reps' ? 'reps' : 's'}
                  </span>
                </span>
              </button>
            )
          })}
        </section>

        <div className="aura-card-soft p-4">
          <p className="text-sm font-medium text-summit-ink">📍 {COACH_META[exerciseId].tip}</p>
        </div>

        <button onClick={() => setStarted(true)} className="w-full aura-button-primary">
          Démarrer la caméra 🎥
        </button>
        <button
          onClick={() => navigate('/sport')}
          className="w-full rounded-2xl border-2 border-summit-line py-3 text-sm font-black uppercase tracking-wide text-summit-muted"
        >
          Retour
        </button>
      </div>
    )
  }

  // --- Écran caméra ---
  const reps = live?.kind === 'reps' ? live.reps : 0
  const heldS = live?.kind === 'hold' ? Math.floor(live.heldMs / 1000) : 0
  const feedback = live?.feedback ?? []

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <p className="summit-label">{def.label}</p>
          <h1 className="font-display text-3xl font-black text-summit-ink">Coach</h1>
        </div>
        <button
          onClick={stop}
          className="rounded-full border-2 border-summit-line bg-summit-surface px-3 py-1.5 text-sm font-black text-summit-ink shadow-[3px_3px_0_rgba(31,25,19,0.14)]"
        >
          Arrêter
        </button>
      </header>

      <div className="relative overflow-hidden rounded-[1.6rem] border-2 border-summit-line bg-summit-night shadow-[8px_8px_0_rgba(31,25,19,0.18)]">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`block w-full ${facing === 'user' ? '-scale-x-100' : ''}`}
        />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

        {/* Compteur en surimpression */}
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
          <div className="absolute inset-0 flex items-center justify-center bg-summit-night/80 p-6 text-center">
            <p className="text-sm font-bold text-summit-cream">
              {status === 'loading' && 'Initialisation de la caméra et du modèle…'}
              {status === 'error' && errorMsg}
            </p>
          </div>
        )}
      </div>

      {/* Feedback posture */}
      <div className="min-h-[2.5rem] flex flex-wrap gap-2">
        {feedback.map((f) => (
          <span
            key={f}
            className="rounded-full border-2 border-summit-line bg-summit-cream px-3 py-1 text-xs font-bold text-summit-ink"
          >
            ⚠️ {f}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
          className="flex-1 rounded-2xl border-2 border-summit-line bg-summit-surface py-2.5 text-sm font-black uppercase tracking-wide text-summit-ink"
        >
          🔄 Caméra
        </button>
      </div>

      {/* Overlay de fin */}
      {done && (
        <div className="aura-card p-6 text-center">
          <div className="text-5xl">🏔️</div>
          <h2 className="mt-2 text-2xl font-black text-summit-ink">Objectif atteint !</h2>
          <p className="mt-1 text-summit-muted">
            {isHold ? `${formatDuration(target)} de gainage` : `${target} ${def.label.toLowerCase()}`}
          </p>
          {saved ? (
            <p className="mt-4 font-black text-summit-success">Bloc validé ✅ (+1 sur les {SPORT_BLOCKS_PER_DAY})</p>
          ) : (
            <button onClick={validateBlock} className="mt-4 w-full aura-button-primary">
              Valider ce bloc de sport
            </button>
          )}
          <button
            onClick={() => setStarted(false)}
            className="mt-2 w-full rounded-2xl border-2 border-summit-line py-2.5 text-sm font-black uppercase tracking-wide text-summit-muted"
          >
            Terminer
          </button>
        </div>
      )}
    </div>
  )
}

// --- Dessin du squelette --------------------------------------------------

function clearCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx?.clearRect(0, 0, canvas.width, canvas.height)
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
  if (name === 'NotAllowedError') return "Accès caméra refusé. Autorise la caméra dans ton navigateur."
  if (name === 'NotFoundError') return 'Aucune caméra détectée sur cet appareil.'
  return `Erreur caméra : ${(err as Error)?.message ?? 'inconnue'}`
}
