// Fonction Edge Supabase (Deno) : envoie les rappels Web Push dus.
// Déclenchée par pg_cron toutes les 15 minutes (voir migrations/0002_cron.sql).
//
// Secrets requis (supabase secrets set ...) :
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex. mailto:toi@mail.fr)
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectés automatiquement.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:summit@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

// Doit rester aligné avec la fréquence du cron (minutes).
const WINDOW_MINUTES = 15

// Libellés des tâches (alignés avec src/domain/routine.ts).
const TASK_LABELS: Record<string, string> = {
  visage_matin: 'Soin visage du matin 🧴',
  visage_soir: 'Soin visage du soir 🌙',
  pied: 'Soin des pieds 🦶',
  dev: '1 h de dev 💻',
  prepa: '1 h de prépa MP2I 📐',
}

const SPORT_BLOCKS_PER_DAY = 4

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/** Une heure HH:MM est-elle due dans la fenêtre courante (heure locale) ? */
function isDue(hhmm: string | undefined, localMinutes: number): boolean {
  if (!hhmm) return false
  const r = toMinutes(hhmm)
  if (r === null) return false
  const diff = localMinutes - r
  return diff >= 0 && diff < WINDOW_MINUTES
}

interface PushSub {
  user_id: string
  endpoint: string
  subscription: unknown
  tz_offset: number
}

Deno.serve(async (req) => {
  // Protection par secret partagé (le cron envoie l'en-tête x-cron-secret).
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret && req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

  const { data: subs, error } = await supabase.from('push_subscriptions').select('*')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const nowUtcMinutes = (() => {
    const d = new Date()
    return d.getUTCHours() * 60 + d.getUTCMinutes()
  })()

  let sent = 0

  for (const sub of (subs ?? []) as PushSub[]) {
    const localMinutes = ((nowUtcMinutes + sub.tz_offset) % 1440 + 1440) % 1440

    // Date locale (YYYY-MM-DD) de l'utilisateur.
    const localDate = new Date(Date.now() + sub.tz_offset * 60_000).toISOString().slice(0, 10)

    const { data: settingsRow } = await supabase
      .from('settings')
      .select('data')
      .eq('user_id', sub.user_id)
      .maybeSingle()

    const reminders = settingsRow?.data?.reminders
    if (!reminders) continue

    const { data: logRow } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', sub.user_id)
      .eq('date', localDate)
      .maybeSingle()

    const tasksDone: Record<string, boolean> = logRow?.tasks ?? {}
    const sportBlocks: number = logRow?.sport_blocks ?? 0

    const messages: { title: string; body: string; tag: string }[] = []

    // Rappels des tâches non faites dont l'heure est due.
    const times: Record<string, string> = reminders.times ?? {}
    for (const [taskId, label] of Object.entries(TASK_LABELS)) {
      if (isDue(times[taskId], localMinutes) && tasksDone[taskId] !== true) {
        messages.push({ title: 'Summit 🏔️', body: `À faire : ${label}`, tag: `task-${taskId}` })
      }
    }

    // Relance sport en fin de journée s'il reste des blocs.
    if (isDue(reminders.sportEndOfDay, localMinutes) && sportBlocks < SPORT_BLOCKS_PER_DAY) {
      const remaining = SPORT_BLOCKS_PER_DAY - sportBlocks
      messages.push({
        title: 'Summit 🏔️',
        body: `Il te reste ${remaining} bloc(s) de sport. Stay Strong! 💪`,
        tag: 'sport-eod',
      })
    }

    for (const msg of messages) {
      try {
        await webpush.sendNotification(
          sub.subscription as webpush.PushSubscription,
          JSON.stringify({ ...msg, url: '/' }),
        )
        sent++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // Abonnement expiré : on le supprime.
        if (status === 404 || status === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', sub.user_id)
            .eq('endpoint', sub.endpoint)
        }
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, subs: (subs ?? []).length }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
