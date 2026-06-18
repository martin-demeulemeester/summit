import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../db/hooks'
import { addSportBlock } from '../db/db'
import { EXERCISES, SPORT_BLOCKS_PER_DAY, exerciseById, type ExerciseId } from '../domain/routine'
import { formatDuration, todayKey } from '../lib/date'
import { COACH_META } from '../coach/exercises'
import CoachCamera from '../coach/CoachCamera'

export default function Coach() {
  const settings = useSettings()
  const navigate = useNavigate()

  const [exerciseId, setExerciseId] = useState<ExerciseId>('pompes')
  const [started, setStarted] = useState(false)
  const [done, setDone] = useState(false)
  const [saved, setSaved] = useState(false)

  const def = exerciseById(exerciseId)
  const target = settings?.targets[exerciseId] ?? def.initialTarget
  const isHold = exerciseId === 'gainage'

  async function validateBlock() {
    await addSportBlock(todayKey())
    setSaved(true)
  }

  // --- Sélection ---
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

        <button onClick={() => { setStarted(true); setDone(false); setSaved(false) }} className="w-full aura-button-primary">
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

  // --- Caméra / fin ---
  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <p className="summit-label">{def.label}</p>
          <h1 className="font-display text-3xl font-black text-summit-ink">Coach</h1>
        </div>
        <button
          onClick={() => setStarted(false)}
          className="rounded-full border-2 border-summit-line bg-summit-surface px-3 py-1.5 text-sm font-black text-summit-ink shadow-[3px_3px_0_rgba(31,25,19,0.14)]"
        >
          Arrêter
        </button>
      </header>

      {!done ? (
        <CoachCamera exerciseId={exerciseId} target={target} onComplete={() => setDone(true)} />
      ) : (
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
