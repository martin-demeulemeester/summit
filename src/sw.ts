/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

// Service worker Summit : précache (offline) + notifications Web Push.
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

// Précache les assets injectés au build (mode hors-ligne).
precacheAndRoute(self.__WB_MANIFEST)

// Active immédiatement la nouvelle version.
self.addEventListener('install', () => {
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

interface PushPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
}

// Réception d'un push : affiche la notification.
self.addEventListener('push', (event) => {
  let payload: PushPayload = {}
  try {
    payload = event.data?.json() ?? {}
  } catch {
    payload = { body: event.data?.text() }
  }

  const title = payload.title ?? 'Summit'
  const options: NotificationOptions = {
    body: payload.body ?? 'Stay Strong! 🏔️',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: payload.tag,
    data: { url: payload.url ?? '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Clic sur une notification : ouvre / met au premier plan l'app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data?.url as string) ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
