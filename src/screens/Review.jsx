import { useGoals } from '../hooks/useGoals'
import { useLocalStorage } from '../hooks/useLocalStorage'

function getWeekKey() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function getPast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  })
}

function formatShortDate(dateStr) {
  // without the time, Date() treats "YYYY-MM-DD" as UTC midnight, which shifts the day in negative-offset timezones
  const d = new Date(dateStr + 'T00:00:00')
  const isToday = dateStr === new Date().toISOString().slice(0, 10)
  if (isToday) return 'Today'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Review() {
  const { getDailyGoals, isCompletedOn } = useGoals()
  const [reflections, setReflections] = useLocalStorage('momentum_reflections', {})

  const weekKey = getWeekKey()
  const past7 = getPast7Days()
  const dailyGoals = getDailyGoals()

  function handleReflection(text) {
    setReflections(prev => ({ ...prev, [weekKey]: text }))
  }

  const totalCompletionsThisWeek = past7.reduce((sum, date) => {
    return sum + dailyGoals.filter(g => isCompletedOn(g.id, date)).length
  }, 0)
  const maxPossible = dailyGoals.length * 7

  return (
    <div className="screen">
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>
        Weekly Review
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}>
        Past 7 days
      </p>
      {maxPossible > 0 && (
        <p style={{ color: 'var(--accent-light)', fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
          {totalCompletionsThisWeek} / {maxPossible} completed
        </p>
      )}
      {dailyGoals.length === 0 && (
        <div style={{
          marginBottom: 28,
          textAlign: 'center',
          color: 'var(--text-muted)',
          padding: '40px 0',
          fontSize: 14,
          lineHeight: 1.7,
        }}>
          No daily goals to review yet.
        </div>
      )}

      {dailyGoals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {past7.map(date => {
            const done = dailyGoals.filter(g => isCompletedOn(g.id, date)).length
            const total = dailyGoals.length
            const allDone = done === total && total > 0

            return (
              <div key={date} style={{
                background: 'var(--surface)',
                border: `1px solid ${allDone ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 14,
                padding: '16px 18px',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: allDone ? 'var(--accent-light)' : 'var(--text-secondary)' }}>
                    {formatShortDate(date)}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: allDone ? 'var(--accent-glow)' : 'var(--surface2)',
                    color: allDone ? 'var(--accent-light)' : 'var(--text-muted)',
                    padding: '3px 9px',
                    borderRadius: 99,
                  }}>
                    {done}/{total}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {dailyGoals.map(goal => {
                    const completed = isCompletedOn(goal.id, date)
                    return (
                      <div key={goal.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                        <div style={{
                          width: 15,
                          height: 15,
                          borderRadius: 4,
                          background: completed ? 'var(--accent-mid)' : 'transparent',
                          border: `1.5px solid ${completed ? 'var(--accent-light)' : 'var(--text-muted)'}`,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: completed ? 1 : 0.35,
                        }}>
                          {completed && (
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                              <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: completed ? 'var(--text)' : 'var(--text-muted)',
                          textDecoration: !completed ? 'none' : 'none',
                          opacity: completed ? 1 : 0.45,
                        }}>
                          {goal.title}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        padding: '20px 20px 22px',
      }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
          Reflection
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          How did your week go?
        </p>
        <textarea
          value={reflections[weekKey] || ''}
          onChange={e => handleReflection(e.target.value)}
          placeholder="Write your thoughts here..."
          rows={5}
          style={{
            width: '100%',
            padding: '13px 14px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            color: 'var(--text)',
            fontSize: 15,
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.6,
            transition: 'border-color 0.2s',
          }}
        />
      </div>
    </div>
  )
}
