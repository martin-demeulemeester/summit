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
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md px-3 pb-2">
      <ul className="aura-card-soft flex items-stretch justify-around px-2 py-2">
        {ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-summit-accent text-white shadow-[0_8px_18px_rgba(124,58,237,0.22)]'
                    : 'text-summit-muted hover:text-summit-ink'
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
