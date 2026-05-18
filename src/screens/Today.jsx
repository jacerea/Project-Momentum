import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function Today() {
  const { today, getDailyGoals, isCompletedOn, toggleCompletion, addGoal } = useGoals()
  const [newTitle, setNewTitle] = useState('')

  const dailyGoals = getDailyGoals()
  const completed = dailyGoals.filter(g => isCompletedOn(g.id, today)).length
  const total = dailyGoals.length
  const progress = total > 0 ? (completed / total) * 100 : 0

  function handleAdd(e) {
    e.preventDefault()
    if (newTitle.trim()) {
      addGoal(newTitle.trim(), 'daily')
      setNewTitle('')
    }
  }

  return (
    <div className="screen">
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4, letterSpacing: '0.02em' }}>
        {formatDate(today)}
      </p>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 28, letterSpacing: '-0.5px' }}>
        Today
      </h1>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Daily progress
          </span>
          <span style={{ fontSize: 13, color: 'var(--accent-light)', fontWeight: 700 }}>
            {completed} / {total}
          </span>
        </div>
        <div style={{
          height: 7,
          background: 'var(--surface2)',
          borderRadius: 99,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
            borderRadius: 99,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
        {total > 0 && completed === total && (
          <p style={{ fontSize: 13, color: 'var(--accent-light)', marginTop: 8, fontWeight: 500 }}>
            All done! Great work today.
          </p>
        )}
      </div>

      {dailyGoals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          padding: '48px 0',
          fontSize: 14,
          lineHeight: 1.7,
        }}>
          No daily goals yet.<br />Add one below to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {dailyGoals.map((goal, index) => {
            const done = isCompletedOn(goal.id, today)
            return (
              <button
                key={goal.id}
                onClick={() => toggleCompletion(goal.id)}
                className="goal-btn stagger-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '15px 16px',
                  background: done ? 'var(--accent-glow)' : 'var(--surface)',
                  border: `1px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 14,
                  color: done ? 'var(--accent-light)' : 'var(--text)',
                  textAlign: 'left',
                  width: '100%',
                  // 50ms apart — tight enough to feel snappy, spread enough to see the cascade
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* key changes on toggle so the pop animation re-fires each time */}
                <div
                  key={String(done)}
                  className={done ? 'check-pop' : ''}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    border: `2px solid ${done ? 'var(--accent-light)' : 'var(--text-muted)'}`,
                    background: done ? 'var(--accent-mid)' : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}
                >
                  {done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: 15,
                  fontWeight: 500,
                  textDecoration: done ? 'line-through' : 'none',
                  opacity: done ? 0.6 : 1,
                  transition: 'opacity 0.2s, text-decoration 0.2s',
                }}>
                  {goal.title}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10 }}>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Add a daily goal..."
          style={{
            flex: 1,
            padding: '13px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            color: 'var(--text)',
            fontSize: 15,
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        />
        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="quick-add-btn"
          style={{
            padding: '13px 20px',
            background: newTitle.trim() ? 'var(--accent-mid)' : 'var(--surface2)',
            border: 'none',
            borderRadius: 12,
            color: newTitle.trim() ? 'white' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: 20,
            lineHeight: 1,
          }}
        >
          +
        </button>
      </form>
    </div>
  )
}
