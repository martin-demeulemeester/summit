import { useState, type ReactNode } from 'react'
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
    return <div className="flex h-64 items-center justify-center text-summit-muted">Chargement...</div>
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
        <h1 className="text-3xl font-extrabold text-summit-ink">Réglages</h1>
      </header>

      <Section title="Compte & sauvegarde cloud">
        <CloudAccount />
      </Section>

      <Section title="Notifications locales">
        <div className="aura-card p-4">
          {notifPerm === 'granted' ? (
            <p className="text-sm font-semibold text-summit-success">✅ Notifications autorisées sur cet appareil.</p>
          ) : (
            <button onClick={requestNotifications} className="w-full aura-button-primary py-2.5 text-sm">
              Autoriser les notifications
            </button>
          )}
          <p className="mt-2 text-xs text-summit-muted">
            Les rappels planifiés même appli fermée passent par la sauvegarde cloud et Web Push.
          </p>
        </div>
      </Section>

      <Section title="Heures de rappel">
        <div className="space-y-2">
          {DAILY_TASKS.map((task) => (
            <div key={task.id} className="aura-card-soft flex items-center justify-between p-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-summit-ink">
                <span className="text-xl">{task.emoji}</span>
                {task.label}
              </span>
              <input
                type="time"
                value={settings.reminders.times[task.id] ?? task.defaultReminder}
                onChange={(e) => setReminderTime(task.id, e.target.value)}
                className="rounded-xl border border-summit-line bg-white px-2 py-1 text-sm font-semibold text-summit-ink"
              />
            </div>
          ))}
          <div className="aura-card-soft flex items-center justify-between p-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-summit-ink">
              <span className="text-xl">💪</span>
              Relance sport
            </span>
            <input
              type="time"
              value={settings.reminders.sportEndOfDay}
              onChange={(e) => patch({ reminders: { ...settings.reminders, sportEndOfDay: e.target.value } })}
              className="rounded-xl border border-summit-line bg-white px-2 py-1 text-sm font-semibold text-summit-ink"
            />
          </div>
        </div>
      </Section>

      <Section title="Cibles actuelles">
        <div className="space-y-2">
          {EXERCISES.map((ex) => (
            <div key={ex.id} className="aura-card-soft flex items-center justify-between p-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-summit-ink">
                <span className="text-xl">{ex.emoji}</span>
                {ex.label}
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setTarget(ex.id, -ex.increment)} className="h-8 w-8 rounded-xl bg-white text-lg font-bold text-summit-accent shadow-sm">
                  -
                </button>
                <span className="w-16 text-center font-extrabold text-summit-accent">
                  {settings.targets[ex.id]} {ex.unit === 'reps' ? 'reps' : 's'}
                </span>
                <button onClick={() => setTarget(ex.id, ex.increment)} className="h-8 w-8 rounded-xl bg-white text-lg font-bold text-summit-accent shadow-sm">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <section>
        <button onClick={handleReset} className="w-full rounded-2xl border border-summit-danger/30 bg-white py-3 text-sm font-semibold text-summit-danger">
          Réinitialiser toutes les données
        </button>
      </section>

      <footer className="pt-2 text-center text-xs font-medium text-summit-muted">
        Summit v{APP_VERSION} · Stay Strong!
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-summit-muted">{title}</h2>
      {children}
    </section>
  )
}
