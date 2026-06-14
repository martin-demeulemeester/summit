import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Jour', mark: '01', end: true },
  { to: '/sport', label: 'Sport', mark: '02', end: false },
  { to: '/progression', label: 'Progrès', mark: '03', end: false },
  { to: '/historique', label: 'Histo', mark: '04', end: false },
  { to: '/reglages', label: 'Réglages', mark: '05', end: false },
]

export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md px-3 pb-2">
      <ul className="rounded-[1.4rem] border-2 border-summit-line bg-summit-paper/95 px-2 py-2 shadow-[0_-10px_34px_rgba(31,25,19,0.14)] backdrop-blur">
        <div className="flex items-stretch justify-around">
          {ITEMS.map((item) => (
            <li key={item.to} className="flex-1 list-none">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center rounded-2xl py-1.5 text-[10px] font-black uppercase tracking-wide transition-transform ${
                    isActive
                      ? 'bg-summit-accent text-summit-night shadow-[3px_3px_0_rgba(31,25,19,0.22)]'
                      : 'text-summit-muted hover:-translate-y-0.5 hover:text-summit-ink'
                  }`
                }
              >
                <span className="font-display text-base leading-none">{item.mark}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </div>
      </ul>
    </nav>
  )
}
