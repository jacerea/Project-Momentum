import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import { Trash2 } from 'lucide-react'

const TYPES = ['Daily', 'Weekly', 'Monthly', 'Yearly']

const TYPE_COLORS = {
  Daily: '#40916c',
  Weekly: '#3a7fc1',
  Monthly: '#9b72cf',
  Yearly: '#d4845a',
}

export default function Goals() {
  const { goals, addGoal, deleteGoal } = useGoals()
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Daily')

  function handleAdd(e) {
    e.preventDefault()
    if (title.trim()) {
      addGoal(title.trim(), type.toLowerCase())
      setTitle('')
    }
  }

  const grouped = TYPES.reduce((acc, t) => {
    acc[t] = goals.filter(g => g.type === t.toLowerCase())
    return acc
  }, {})

  return (
    <div className="screen">
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.5px' }}>
        Goals
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 36 }}>
        {goals.length} goal{goals.length !== 1 ? 's' : ''} total
      </p>

      <div className="goals-layout">
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: '20px 20px 22px',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>
            New goal
          </h2>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Goal title..."
              style={{
                padding: '12px 14px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontSize: 15,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              {TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="type-btn"
                  style={{
                    flex: 1,
                    padding: '9px 4px',
                    background: type === t ? TYPE_COLORS[t] : 'var(--surface2)',
                    border: `1.5px solid ${type === t ? TYPE_COLORS[t] : 'var(--border)'}`,
                    borderRadius: 9,
                    color: type === t ? 'white' : 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!title.trim()}
              className="submit-btn"
              style={{
                padding: '13px',
                background: title.trim() ? 'var(--accent-mid)' : 'var(--surface2)',
                border: 'none',
                borderRadius: 10,
                color: title.trim() ? 'white' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              Add Goal
            </button>
          </form>
        </div>

        <div>
          {goals.length === 0 ? (
            <div style={{
              color: 'var(--text-muted)',
              padding: '40px 0',
              fontSize: 14,
              lineHeight: 1.7,
            }}>
              No goals yet. Add your first one.
            </div>
          ) : (
            TYPES.map(t => {
              const items = grouped[t]
              if (items.length === 0) return null
              return (
                <div key={t} style={{ marginBottom: 30 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: TYPE_COLORS[t],
                      flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontFamily: 'var(--font-heading)',
                    }}>
                      {t}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginLeft: 'auto',
                      background: 'var(--surface2)',
                      padding: '2px 8px',
                      borderRadius: 99,
                    }}>
                      {items.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((goal, index) => (
                      <div
                        key={goal.id}
                        className="goal-item-card stagger-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '14px 16px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          gap: 14,
                          animationDelay: `${index * 0.05}s`,
                        }}
                      >
                        <div style={{
                          width: 3,
                          height: 32,
                          background: TYPE_COLORS[t],
                          borderRadius: 2,
                          flexShrink: 0,
                          opacity: 0.8,
                        }} />
                        <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
                          {goal.title}
                        </span>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="delete-btn"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: 6,
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
