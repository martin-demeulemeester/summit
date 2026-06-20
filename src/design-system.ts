// Surface de design system exposée à Claude Design (exports nommés).
// Ce fichier n'est pas utilisé par l'app ; il sert uniquement à la synchro
// /design-sync pour exposer les composants sous window.Summit.*.

export { default as ProgressBar } from './components/ProgressBar'
export { default as StreakHeader } from './components/StreakHeader'
export { default as BottomNav } from './components/BottomNav'
export { default as CloudAccount } from './components/CloudAccount'
export { default as CoachCamera } from './coach/CoachCamera'

export { default as TodayScreen } from './pages/Today'
export { default as WorkoutScreen } from './pages/Workout'
export { default as ProgressScreen } from './pages/Progress'
export { default as HistoryScreen } from './pages/History'
export { default as SettingsScreen } from './pages/Settings'
export { default as CoachScreen } from './pages/Coach'

// Provider utilisé pour les aperçus (les composants utilisent react-router).
export { MemoryRouter } from 'react-router-dom'
