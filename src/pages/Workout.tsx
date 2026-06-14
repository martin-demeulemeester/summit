import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLog, useSettings } from '../db/hooks'
import { addSportBlock } from '../db/db'
import {
  REST_SECONDS,
  SPORT_BLOCKS_PER_DAY,
  exerciseById,
  type ExerciseId,
} from '../domain/routine'
import { formatDuration, todayKey } from '../lib/date'
import type { Settings } from '../domain/types'

type Step =
  | { kind: 'reps'; ex: ExerciseId }
  | { kind: 'rest' }
  | { kind: 'hold'; ex: ExerciseId }

const STEPS: Step[] = [
  { kind: 'reps', ex: 'tractions' },
  { kind: 'rest' },
  { kind: 'reps', ex: 'pompes' },
  { kind: 'rest' },
  { kind: 'hold', ex: 'gainage' },
]

export default function Workout() {
  const today = todayKey()
  const settings = useSettings()
  const log = useLog(today)
  const navigate = useNavigate()

  const [index, setIndex] = useState(0)
  const [finished, setFinished] = useState(false)

  if (!settings || !log) {
    return <div className="flex h-64 items-center justify-center text-summit-muted">Chargement...</div>
  }

  const blocksDone = Math.min(log.sportBlocks ?? 0, SPORT_BLOCKS_PER_DAY)

  async function finishBlock() {
    await addSportBlock(today)
    setFinished(true)
  }

  function next() {
    if (index >= STEPS.length - 1) {
      void finishBlock()
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (finished) {
    return <BlockDone blocksDone={Math.min(blocksDone + 1, SPORT_BLOCKS_PER_DAY)} onClose={() => navigate('/')} />
  }

  const step = STEPS[index]

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-summit-muted">
            Bloc {blocksDone + 1} / {SPORT_BLOCKS_PER_DAY} · étape {index + 1} / {STEPS.length}
          </p>
          <h1 className="text-3xl font-extrabold text-summit-ink">Séance sport</h1>
        </div>
        <button onClick={() => navigate('/')} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-summit-muted shadow-sm">
          Quitter
        </button>
      </header>

      <StepProgress index={index} total={STEPS.length} />

      {step.kind === 'reps' && <RepsStep ex={step.ex} settings={settings} onDone={next} />}
      {step.kind === 'rest' && <RestStep onDone={next} />}
      {step.kind === 'hold' && <HoldStep ex={step.ex} settings={settings} onDone={next} />}
    </div>
  )
}

function StepProgress({ index, total }: { index: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full ${i <= index ? 'bg-summit-accent' : 'bg-summit-surface2/80'}`}
        />
      ))}
    </div>
  )
}

function RepsStep({
  ex,
  settings,
  onDone,
}: {
  ex: ExerciseId
  settings: Settings
  onDone: () => void
}) {
  const def = exerciseById(ex)
  const target = settings.targets[ex]
  return (
    <div className="aura-card flex flex-col items-center p-8 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-summit-bg text-6xl">{def.emoji}</span>
      <h2 className="mt-5 text-xl font-extrabold text-summit-ink">{def.label}</h2>
      <p className="mt-2 text-6xl font-extrabold text-summit-accent">{target}</p>
      <p className="text-sm font-medium text-summit-muted">répétitions ou ta progression</p>
      <button onClick={onDone} className="mt-8 w-full aura-button-primary">
        C'est fait
      </button>
    </div>
  )
}

function RestStep({ onDone }: { onDone: () => void }) {
  const remaining = useCountdown(REST_SECONDS, onDone)
  return (
    <div className="aura-card flex flex-col items-center bg-summit-cream p-8 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-6xl">⏱️</span>
      <h2 className="mt-5 text-xl font-extrabold text-summit-ink">Repos</h2>
      <p className="mt-2 font-mono text-6xl font-extrabold text-summit-warn">{formatDuration(remaining)}</p>
      <button onClick={onDone} className="mt-8 w-full aura-button-secondary">
        Passer le repos
      </button>
    </div>
  )
}

function HoldStep({
  ex,
  settings,
  onDone,
}: {
  ex: ExerciseId
  settings: Settings
  onDone: () => void
}) {
  const def = exerciseById(ex)
  const target = settings.targets[ex]
  const [started, setStarted] = useState(false)

  return (
    <div className="aura-card flex flex-col items-center p-8 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-summit-bg text-6xl">{def.emoji}</span>
      <h2 className="mt-5 text-xl font-extrabold text-summit-ink">{def.label}</h2>
      {!started ? (
        <>
          <p className="mt-2 text-6xl font-extrabold text-summit-accent">{formatDuration(target)}</p>
          <p className="text-sm font-medium text-summit-muted">à tenir ou ta progression</p>
          <button onClick={() => setStarted(true)} className="mt-8 w-full aura-button-primary">
            Démarrer le gainage
          </button>
        </>
      ) : (
        <HoldTimer seconds={target} onDone={onDone} />
      )}
    </div>
  )
}

function HoldTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const remaining = useCountdown(seconds, onDone)
  return (
    <>
      <p className="mt-2 font-mono text-6xl font-extrabold text-summit-success">{formatDuration(remaining)}</p>
      <p className="text-sm font-medium text-summit-muted">Tiens la position 🪵</p>
      <button onClick={onDone} className="mt-8 w-full aura-button-secondary">
        Terminer
      </button>
    </>
  )
}

function BlockDone({ blocksDone, onClose }: { blocksDone: number; onClose: () => void }) {
  const allDone = blocksDone >= SPORT_BLOCKS_PER_DAY
  return (
    <div className="aura-card flex flex-col items-center p-8 text-center">
      <span className="text-6xl">{allDone ? '🏔️' : '🔥'}</span>
      <h2 className="mt-4 text-2xl font-extrabold text-summit-ink">Bloc terminé !</h2>
      <p className="mt-2 text-summit-muted">
        {blocksDone} / {SPORT_BLOCKS_PER_DAY} blocs aujourd'hui
      </p>
      <p className="mt-1 font-semibold text-summit-accent">
        {allDone ? 'Tous les blocs sont faits. Stay Strong!' : 'Stay Strong!'}
      </p>
      <button onClick={onClose} className="mt-8 w-full aura-button-primary">
        Retour à l'accueil
      </button>
    </div>
  )
}

/** Compte à rebours qui appelle onDone une fois arrivé à zéro. */
function useCountdown(seconds: number, onDone: () => void): number {
  const [remaining, setRemaining] = useState(seconds)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const startedAt = useMemo(() => Date.now(), [])

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const left = Math.max(0, seconds - elapsed)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(id)
        onDoneRef.current()
      }
    }, 250)
    return () => clearInterval(id)
  }, [seconds, startedAt])

  return remaining
}
