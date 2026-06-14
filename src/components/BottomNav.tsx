import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Jour', emoji: '☀️', end: true },
  { to: '/sport', label: 'Sport', emoji: '💪', end: false },
  { to: '/progression', label: 'Progrès', emoji: '📈', end: false },
  { to: '/historique', label: 'Histo', emoji: '📅', end: false },
  { to: '/reglages', label: 'Réglages', emoji: '⚙️', end: false },
]

export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-summit-surface2/60 bg-summit-surface/95 backdrop-blur">
      <ul className="flex items-stretch justify-around px-2 py-1.5">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-summit-accent'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <span className="text-lg leading-none">{item.emoji}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
