import { useGoals } from '../hooks/useGoals'
import DonutChart from '../components/DonutChart'
import HeatmapCalendar from '../components/HeatmapCalendar'
import { ShieldCheck } from 'lucide-react'

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

function StatCard({ label, value, unit, color, wide, children }) {
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
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {unit}
        </div>
      </div>
      {children}
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

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
    </div>
  )
}

export default function Stats() {
  const {
    goals, completions, today,
    getDailyGoals, isCompletedOn,
    freezeCount, freezeDay, isDayFrozen,
    getStreak,
  } = useGoals()

  const streak = getStreak()
  const { completed, totalPossible, rate } = getMonthStats(completions, goals)
  const incomplete = Math.max(0, totalPossible - completed)
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  // Check if yesterday is unprotected and the streak dropped because of it
  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
  })()
  const dailyGoals = getDailyGoals()
  const yesterdayMissed = dailyGoals.length > 0
    && !dailyGoals.some(g => isCompletedOn(g.id, yesterday))
    && !isDayFrozen(yesterday)
  const canUseFreeze = yesterdayMissed && freezeCount > 0

  function handleExport() {
    const data = { goals, completions, exportedAt: new Date().toISOString(), version: 1 }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `momentum-backup-${today}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px' }}>Stats</h1>
        <button
          onClick={handleExport}
          style={{
            padding: '8px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          Export data
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
        {currentMonth}
      </p>

      {/* Stat cards */}
      <div className="stats-grid" style={{ display: 'grid', gap: 12, marginBottom: 12 }}>
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
          label="Streak freezes"
          value={freezeCount}
          unit={freezeCount === 1 ? 'shield available' : 'shields available'}
          color="#e8a838"
        />
        <StatCard
          label="Success rate"
          value={`${rate}%`}
          unit="daily goals this month"
          color="#4d9de0"
          wide
        />
      </div>

      {/* Freeze banner — only visible if yesterday was missed and user has a freeze */}
      {canUseFreeze && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: 'rgba(232, 168, 56, 0.08)',
          border: '1px solid rgba(232, 168, 56, 0.3)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={18} color="#e8a838" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                You missed yesterday
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                Use a streak shield to protect your streak
              </p>
            </div>
          </div>
          <button
            onClick={() => freezeDay(yesterday)}
            style={{
              padding: '8px 16px',
              background: '#e8a838',
              border: 'none',
              borderRadius: 8,
              color: '#0d1117',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Use shield
          </button>
        </div>
      )}

      {/* Activity heatmap */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '22px 24px 20px',
        marginBottom: 20,
      }}>
        <SectionHeader
          title="Activity"
          subtitle="Daily goal completions over the past 16 weeks"
        />
        <HeatmapCalendar completions={completions} dailyGoals={dailyGoals} />
      </div>

      {/* Monthly donut */}
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
