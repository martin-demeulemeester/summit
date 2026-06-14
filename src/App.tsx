import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Today from './pages/Today'
import Workout from './pages/Workout'
import Progress from './pages/Progress'
import History from './pages/History'
import SettingsPage from './pages/Settings'
import { useAuth } from './lib/auth'
import { fullSync } from './lib/sync'

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
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <SyncManager />
      <main className="safe-top flex-1 px-4 pb-28 pt-5">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/sport" element={<Workout />} />
          <Route path="/progression" element={<Progress />} />
          <Route path="/historique" element={<History />} />
          <Route path="/reglages" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
