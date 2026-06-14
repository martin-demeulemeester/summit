import { VAPID_PUBLIC_KEY, isPushConfigured, supabase } from './supabase'

/** Convertit une clé VAPID base64url en Uint8Array (format applicationServerKey). */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** Abonne l'appareil aux notifications push et enregistre l'abonnement côté cloud. */
export async function enablePush(sessionToken: string): Promise<void> {
  if (!isPushConfigured || !supabase || !VAPID_PUBLIC_KEY) {
    throw new Error('Cloud ou clé VAPID non configurés')
  }
  if (!pushSupported()) throw new Error('Notifications push non supportées sur cet appareil')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permission de notification refusée')

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }))

  const json = subscription.toJSON()
  const { error } = await supabase.rpc('summit_upsert_push_subscription', {
    session_token: sessionToken,
    endpoint_value: json.endpoint,
    subscription_payload: json,
    tz_offset_value: -new Date().getTimezoneOffset(),
    updated_at_value: Date.now(),
  })
  if (error) throw error
}

/** Désabonne l'appareil et supprime l'abonnement côté cloud. */
export async function disablePush(sessionToken: string): Promise<void> {
  if (!supabase || !pushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return
  await supabase.rpc('summit_delete_push_subscription', {
    session_token: sessionToken,
    endpoint_value: subscription.endpoint,
  })
  await subscription.unsubscribe()
}

/** L'appareil est-il déjà abonné au push ? */
export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false
  const registration = await navigator.serviceWorker.ready
  return (await registration.pushManager.getSubscription()) !== null
}
