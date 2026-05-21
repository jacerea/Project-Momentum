// Onboarding.jsx — First-time user welcome flow
// Completed: May 20, 2026
//
// Without this, new users land on a completely blank Today screen with no goals
// and no idea what to do next — the classic "blank slate" drop-off problem.
// This two-step modal solves that by getting users to commit to at least one
// real goal before they ever see the main app.
//
// Step 0: Welcome screen with a brief value proposition
// Step 1: Grid of 8 suggested daily habits — click to select, click again to deselect
//
// When the user clicks "Start tracking", the selected goals are added directly
// to their goals list via addGoal(), and the modal is dismissed. App.jsx tracks
// whether onboarding has been completed in localStorage ('momentum_onboarded'),
// so this only shows once per device.

import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'

// Pre-written habit suggestions to give users a quick starting point.
// These were chosen to cover common health, wellness, and productivity categories.
// Users can always modify or delete them later from the Goals screen.
const SUGGESTIONS = [
  { title: 'Morning workout', icon: '🏋️' },
  { title: 'Read for 20 minutes', icon: '📚' },
  { title: 'Drink 8 glasses of water', icon: '💧' },
  { title: 'Meditate', icon: '🧘' },
  { title: 'Journal', icon: '✍️' },
  { title: 'Walk 10,000 steps', icon: '🚶' },
  { title: 'No social media before noon', icon: '📵' },
  { title: 'Sleep by 11pm', icon: '😴' },
]

export default function Onboarding({ onComplete }) {
  const { addGoal } = useGoals()

  // step 0 = welcome screen, step 1 = goal picker
  const [step, setStep] = useState(0)

  // Using a Set for selected titles makes toggle logic simple and prevents duplicates
  const [selected, setSelected] = useState(new Set())

  // Add or remove a goal title from the selection set
  function toggle(title) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(title) ? next.delete(title) : next.add(title)
      return next
    })
  }

  // Add all selected goals as 'daily' type, then tell App.jsx we're done.
  // onComplete() sets 'momentum_onboarded' in localStorage so this modal
  // never appears again on this device.
  function handleFinish() {
    selected.forEach(title => addGoal(title, 'daily'))
    onComplete()
  }

  // Shared button styles — defined once here to avoid repeating inline style objects
  const btnStyle = {
    width: '100%',
    padding: '14px',
    background: 'var(--accent-mid)',
    border: 'none',
    borderRadius: 12,
    color: 'white',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    transition: 'opacity 0.15s',
  }

  // The "Skip setup" button uses the same base styles but with no background
  const ghostStyle = {
    ...btnStyle,
    background: 'none',
    color: 'var(--text-muted)',
    fontSize: 14,
    fontWeight: 500,
    marginTop: 8,
  }

  return (
    // Full-screen semi-transparent overlay — blocks interaction with the app behind it
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(13, 17, 23, 0.96)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: 20,
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '40px 40px 32px',
        maxWidth: 520,
        width: '100%',
      }}>
        {step === 0 ? (
          // Step 0 — Welcome screen
          <>
            {/* Lightning bolt icon badge */}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              fontSize: 22,
            }}>
              ⚡
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: '-0.5px' }}>
              Welcome to Momentum
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>
              Track your daily goals, build streaks, and review your
              progress week by week. Set up takes less than a minute.
            </p>
            <button style={btnStyle} onClick={() => setStep(1)}>
              Get started →
            </button>
            {/* Skip lets users bypass goal selection if they want to start from scratch */}
            <button style={ghostStyle} onClick={onComplete}>
              Skip setup
            </button>
          </>
        ) : (
          // Step 1 — Goal picker grid
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.3px' }}>
              Pick your daily goals
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Select any you want to track. You can always add or remove these later.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 28,
            }}>
              {SUGGESTIONS.map(({ title, icon }) => {
                const active = selected.has(title)
                return (
                  // Each card toggles between selected (green border/glow) and
                  // unselected (dark background) on click
                  <button
                    key={title}
                    onClick={() => toggle(title)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '11px 14px',
                      background: active ? 'var(--accent-glow)' : 'var(--surface2)',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 12,
                      color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>
                    {title}
                  </button>
                )
              })}
            </div>
            {/* Button label updates dynamically to reflect how many goals were picked */}
            <button style={btnStyle} onClick={handleFinish}>
              {selected.size > 0
                ? `Add ${selected.size} goal${selected.size > 1 ? 's' : ''} & start tracking`
                : 'Start with a blank slate'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
