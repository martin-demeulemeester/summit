import { lazy, Suspense, useEffect, useRef, type TouchEvent } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Today from './pages/Today'
import Workout from './pages/Workout'
import History from './pages/History'
import SettingsPage from './pages/Settings'
import { useAuth } from './lib/auth'
import { fullSync } from './lib/sync'

// Lazy : MediaPipe (coach caméra) et Recharts (progression) hors du bundle principal.
const Coach = lazy(() => import('./pages/Coach'))
const Progress = lazy(() => import('./pages/Progress'))

function PageFallback({ label }: { label: string }) {
  return <div className="flex h-64 items-center justify-center text-summit-muted">{label}</div>
}

// Ordre de navigation par swipe (identique à la barre du bas). /coach exclu :
// pas de changement de page accidentel pendant un mouvement devant la caméra.
const SWIPE_ROUTES = ['/', '/sport', '/progression', '/historique', '/reglages']

/** Permet de swiper horizontalement pour passer d'une page à l'autre (mobile). */
function useSwipeNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const start = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const s = start.current
    start.current = null
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    // Swipe franc et nettement horizontal (sinon c'est un scroll vertical).
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return
    const i = SWIPE_ROUTES.indexOf(location.pathname)
    if (i === -1) return
    const next = i + (dx < 0 ? 1 : -1)
    if (next >= 0 && next < SWIPE_ROUTES.length) navigate(SWIPE_ROUTES[next])
  }
  return { onTouchStart, onTouchEnd }
}

/** Synchronise avec le cloud à la connexion puis périodiquement. */
function SyncManager() {
  const { session } = useAuth()
  useEffect(() => {
    if (!session) return
    const run = () => fullSync(session.token).catch((e) => console.warn('Synchro échouée', e))
    run()
    const id = setInterval(run, 60_000)
    return () => clearInterval(id)
  }, [session])
  return null
}

export default function App() {
  const location = useLocation()
  const swipe = useSwipeNav()

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <SyncManager />
      <main className="safe-top flex-1 overflow-x-hidden px-4 pb-28 pt-5" {...swipe}>
        <div key={location.pathname} className="summit-page-enter">
          <Routes location={location}>
            <Route path="/" element={<Today />} />
            <Route path="/sport" element={<Workout />} />
            <Route
              path="/coach"
              element={
                <Suspense fallback={<PageFallback label="Chargement de la coach…" />}>
                  <Coach />
                </Suspense>
              }
            />
            <Route
              path="/progression"
              element={
                <Suspense fallback={<PageFallback label="Chargement…" />}>
                  <Progress />
                </Suspense>
              }
            />
            <Route path="/historique" element={<History />} />
            <Route path="/reglages" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
