import { useGoals } from '../hooks/useGoals'
import DonutChart from '../components/DonutChart'

function getStreak(completions) {
  if (completions.length === 0) return 0
  let streak = 0
  const d = new Date()
  while (true) {
    const dateStr = d.toISOString().slice(0, 10)
    const hasCompletion = completions.some(c => c.date === dateStr)
    // starts from today, so if nothing's been checked off today the streak is already broken
    if (!hasCompletion) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function getMonthStats(completions, goals) {
  const now = new Date()
  const monthPrefix = now.toISOString().slice(0, 7)
  const dailyGoals = goals.filter(g => g.type === 'daily')
  const daysElapsed = now.getDate()
  const totalPossible = dailyGoals.length * daysElapsed
  const completed = completions.filter(c => c.date.startsWith(monthPrefix)).length
  const rate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0
  return { completed, totalPossible, rate }
}

function StatCard({ label, value, unit, color, wide }) {
  return (
    <div className="stat-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '18px 18px 16px',
      gridColumn: wide ? '1 / -1' : undefined,
      display: 'flex',
      flexDirection: wide ? 'row' : 'column',
      alignItems: wide ? 'center' : 'flex-start',
      gap: wide ? 18 : 6,
    }}>
      <div style={{
        fontSize: 34,
        fontWeight: 800,
        fontFamily: 'var(--font-heading)',
        color,
        lineHeight: 1,
        letterSpacing: '-1px',
      }}>
        {value}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {unit}
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginLeft: 2 }}>{value}</span>
    </div>
  )
}

export default function Stats() {
  const { goals, completions } = useGoals()

  const streak = getStreak(completions)
  const { completed, totalPossible, rate } = getMonthStats(completions, goals)
  const incomplete = Math.max(0, totalPossible - completed)

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="screen">
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>
        Stats
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
        {currentMonth}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <StatCard
          label="Current streak"
          value={streak}
          unit={streak === 1 ? 'day' : 'days'}
          color="var(--accent-light)"
        />
        <StatCard
          label="Completed"
          value={completed}
          unit="this month"
          color="#b07dd4"
        />
        <StatCard
          label="Success rate"
          value={`${rate}%`}
          unit="daily goals this month"
          color="#4d9de0"
          wide
        />
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '22px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, alignSelf: 'flex-start', color: 'var(--text)' }}>
          Monthly overview
        </h2>
        <DonutChart completed={completed} total={totalPossible} />
        <div style={{ display: 'flex', gap: 28 }}>
          <LegendItem color="var(--accent-mid)" label="Completed" value={completed} />
          <LegendItem color="#1a2537" label="Incomplete" value={incomplete} />
        </div>
      </div>
    </div>
  )
}
