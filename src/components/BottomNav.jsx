import { NavLink } from 'react-router-dom'
import { CalendarCheck, Target, BookOpen, BarChart2 } from 'lucide-react'

const navItems = [
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/review', label: 'Review', icon: BookOpen },
  { to: '/stats', label: 'Stats', icon: BarChart2 },
]

export default function TopNav() {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--nav-height)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      zIndex: 100,
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 800,
        fontSize: 18,
        color: 'var(--accent-light)',
        letterSpacing: '-0.3px',
      }}>
        Momentum
      </span>
      <nav style={{ display: 'flex', gap: 4 }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="nav-label">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
