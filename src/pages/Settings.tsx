import { useState } from 'react'
import { useSettings } from '../db/hooks'
import { resetAll, saveSettings } from '../db/db'
import { DAILY_TASKS, EXERCISES, exerciseById, type ExerciseId, type TaskId } from '../domain/routine'
import { APP_VERSION } from '../version'
import type { Settings } from '../domain/types'
import CloudAccount from '../components/CloudAccount'

export default function SettingsPage() {
  const settings = useSettings()
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  )

  if (!settings) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Chargement…</div>
  }

  async function patch(update: Partial<Settings>) {
    await saveSettings({ ...settings!, ...update })
  }

  async function setReminderTime(taskId: TaskId, value: string) {
    await patch({
      reminders: { ...settings!.reminders, times: { ...settings!.reminders.times, [taskId]: value } },
    })
  }

  async function setTarget(ex: ExerciseId, delta: number) {
    const def = exerciseById(ex)
    const min = def.unit === 'reps' ? 1 : 5
    const next = Math.max(min, settings!.targets[ex] + delta)
    await patch({ targets: { ...settings!.targets, [ex]: next } })
  }

  async function requestNotifications() {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    setNotifPerm(perm)
    await patch({ reminders: { ...settings!.reminders, enabled: perm === 'granted' } })
    if (perm === 'granted') {
      new Notification('Summit', { body: 'Notifications activées. Stay Strong! 🏔️' })
    }
  }

  async function handleReset() {
    if (confirm('Effacer toutes les données (historique, réglages) ? Action irréversible.')) {
      await resetAll()
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Réglages</h1>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Compte &amp; sauvegarde cloud
        </h2>
        <CloudAccount />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Notifications locales
        </h2>
        <div className="rounded-xl border border-summit-surface2/60 bg-summit-surface p-4">
          {notifPerm === 'granted' ? (
            <p className="text-sm text-summit-success">✅ Notifications autorisées sur cet appareil.</p>
          ) : (
            <button
              onClick={requestNotifications}
              className="w-full rounded-lg bg-summit-accent py-2.5 text-sm font-semibold text-summit-bg"
            >
              Autoriser les notifications
            </button>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Les rappels planifiés (même appli fermée) seront activés avec la synchro cloud (Web
            Push). Pour l'instant, l'app peut notifier quand elle est ouverte.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Heures de rappel
        </h2>
        <div className="space-y-2">
          {DAILY_TASKS.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-xl border border-summit-surface2/60 bg-summit-surface p-3"
            >
              <span className="flex items-center gap-2 text-sm text-white">
                <span className="text-xl">{task.emoji}</span>
                {task.label}
              </span>
              <input
                type="time"
                value={settings.reminders.times[task.id] ?? task.defaultReminder}
                onChange={(e) => setReminderTime(task.id, e.target.value)}
                className="rounded-lg bg-summit-bg px-2 py-1 text-sm text-white [color-scheme:dark]"
              />
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl border border-summit-surface2/60 bg-summit-surface p-3">
            <span className="flex items-center gap-2 text-sm text-white">
              <span className="text-xl">💪</span>
              Relance sport (fin de journée)
            </span>
            <input
              type="time"
              value={settings.reminders.sportEndOfDay}
              onChange={(e) =>
                patch({ reminders: { ...settings.reminders, sportEndOfDay: e.target.value } })
              }
              className="rounded-lg bg-summit-bg px-2 py-1 text-sm text-white [color-scheme:dark]"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Cibles actuelles
        </h2>
        <div className="space-y-2">
          {EXERCISES.map((ex) => (
            <div
              key={ex.id}
              className="flex items-center justify-between rounded-xl border border-summit-surface2/60 bg-summit-surface p-3"
            >
              <span className="flex items-center gap-2 text-sm text-white">
                <span className="text-xl">{ex.emoji}</span>
                {ex.label}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTarget(ex.id, -ex.increment)}
                  className="h-8 w-8 rounded-lg bg-summit-surface2 text-lg font-bold text-white"
                >
                  −
                </button>
                <span className="w-16 text-center font-bold text-summit-accent">
                  {settings.targets[ex.id]} {ex.unit === 'reps' ? 'reps' : 's'}
                </span>
                <button
                  onClick={() => setTarget(ex.id, ex.increment)}
                  className="h-8 w-8 rounded-lg bg-summit-surface2 text-lg font-bold text-white"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <button
          onClick={handleReset}
          className="w-full rounded-xl border border-summit-danger/40 py-3 text-sm font-semibold text-summit-danger"
        >
          Réinitialiser toutes les données
        </button>
      </section>

      <footer className="pt-2 text-center text-xs text-slate-600">
        Summit v{APP_VERSION} · Stay Strong!
      </footer>
    </div>
  )
}
