import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
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

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <SyncManager />
      <main className="safe-top flex-1 overflow-x-hidden px-4 pb-28 pt-5">
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
