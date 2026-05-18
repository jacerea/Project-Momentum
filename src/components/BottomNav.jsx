import { NavLink } from 'react-router-dom'
import { CalendarCheck, Target, BookOpen, BarChart2 } from 'lucide-react'

const navItems = [
  { to: '/today', label: 'Today', icon: CalendarCheck },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/review', label: 'Review', icon: BookOpen },
  { to: '/stats', label: 'Stats', icon: BarChart2 },
]

export default function BottomNav() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 'var(--max-width)',
      height: 'var(--nav-height)',
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      zIndex: 100,
    }}>
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            textDecoration: 'none',
            color: isActive ? 'var(--accent-light)' : 'var(--text-muted)',
            fontSize: 11,
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            letterSpacing: '0.03em',
            transition: 'color 0.2s',
            paddingBottom: 4,
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
