import { NavLink, useLocation } from 'react-router-dom'
import { ROOT_ID } from '../data/taxa'

const items = [
  { to: `/n/${ROOT_ID}`, label: 'ツリー', icon: '🌳', match: '/n/' },
  { to: '/search', label: '検索', icon: '🔍', match: '/search' },
  { to: '/me', label: 'マイページ', icon: '👤', match: '/me' },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="bottom-nav">
      {items.map((it) => {
        const active = pathname.startsWith(it.match)
        return (
          <NavLink
            key={it.to}
            to={it.to}
            className={active ? 'nav-item active' : 'nav-item'}
          >
            <span className="nav-icon">{it.icon}</span>
            <span className="nav-label">{it.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
