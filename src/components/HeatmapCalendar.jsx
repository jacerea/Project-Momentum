// HeatmapCalendar.jsx — GitHub-style activity grid for the Stats screen
// Completed: May 20, 2026
//
// Shows 16 weeks (112 days) of daily goal completion history as a grid of colored
// squares. Each square represents one day — darker green = more goals completed.
// This is one of the highest-retention features in habit apps because users get
// attached to visual chains they don't want to break.
//
// The grid is purely presentational — it reads completions and dailyGoals as props
// and does all the math internally. No state, no side effects.

// Layout constants — tweak these to change the size of the grid
const WEEKS = 16   // How many weeks of history to show
const CELL = 14    // Width and height of each day square in pixels
const GAP = 3      // Space between squares in pixels

// Five shades from "nothing" to "everything done".
// Index 0 is the background color (no completions), 1–4 are progressively
// brighter greens matching the app's accent color palette.
const COLORS = [
  'var(--surface2)',  // 0 — no completions that day
  '#1a3d2e',          // 1 — 1–33% of goals completed
  '#2d6a4f',          // 2 — 34–66% of goals completed
  '#40916c',          // 3 — 67–99% of goals completed
  '#52b788',          // 4 — 100% of goals completed (perfect day)
]

// Maps a raw completion count to one of the 5 color levels above.
// Using percentage brackets rather than absolute numbers so the scale stays
// meaningful whether the user has 2 goals or 20.
function getLevel(done, total) {
  if (total === 0 || done === 0) return 0
  const rate = done / total
  if (rate < 0.34) return 1
  if (rate < 0.67) return 2
  if (rate < 1) return 3
  return 4
}

export default function HeatmapCalendar({ completions, dailyGoals }) {
  // Generate the last 112 days as YYYY-MM-DD strings, oldest first.
  // i=0 gives today-111, i=111 gives today — no future dates in the array.
  const dates = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (WEEKS * 7 - 1 - i))
    return d.toISOString().slice(0, 10)
  })

  // Build a lookup map of date → Set<goalId> from the completions array.
  // Using a Set per date means we can check membership in O(1) rather than
  // scanning the full completions array for every cell in the grid.
  const completionMap = {}
  for (const { goalId, date } of completions) {
    if (!completionMap[date]) completionMap[date] = new Set()
    completionMap[date].add(goalId)
  }

  // We only count completions that belong to currently active daily goals.
  // If a goal was deleted, its old completions shouldn't count toward the heatmap.
  const dailyIds = new Set(dailyGoals.map(g => g.id))
  const total = dailyGoals.length

  // Split the flat date array into columns of 7 (one column = one week)
  const weeks = []
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7))
  }

  // Show a month label above the first week column where a new month starts.
  // Comparing the YYYY-MM prefix of the first day in consecutive weeks tells
  // us exactly when a month boundary was crossed.
  const monthLabels = weeks.map((week, i) => {
    const month = week[0].slice(0, 7)
    if (i === 0 || weeks[i - 1][0].slice(0, 7) !== month) {
      return new Date(week[0] + 'T00:00:00').toLocaleString('en-US', { month: 'short' })
    }
    return null
  })

  // Minimum width so the grid doesn't collapse on narrow containers
  const totalWidth = WEEKS * (CELL + GAP) - GAP

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: totalWidth, display: 'inline-block' }}>

        {/* Month labels row — sits above the grid columns */}
        <div style={{ display: 'flex', gap: GAP, marginBottom: 6 }}>
          {weeks.map((_, wi) => (
            <div
              key={wi}
              style={{
                width: CELL,
                flexShrink: 0,
                fontSize: 10,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'visible',  // Let month labels overflow their column without clipping
              }}
            >
              {monthLabels[wi]}
            </div>
          ))}
        </div>

        {/* Main grid — one flex column per week, one cell per day */}
        <div style={{ display: 'flex', gap: GAP }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {week.map((date, di) => {
                const doneSet = completionMap[date]
                // Filter to only count completions for active daily goals,
                // not orphaned completions from deleted goals
                const done = doneSet ? [...doneSet].filter(id => dailyIds.has(id)).length : 0
                const level = getLevel(done, total)
                // Tooltip on hover shows the date and exact completion count
                const label = total > 0
                  ? `${date}  ${done}/${total} goals`
                  : date
                return (
                  <div
                    key={di}
                    title={label}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      background: COLORS[level],
                      flexShrink: 0,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend — "Less ■ ■ ■ ■ ■ More" row at the bottom right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Less</span>
          {COLORS.map((color, i) => (
            <div key={i} style={{ width: CELL, height: CELL, borderRadius: 3, background: color, flexShrink: 0 }} />
          ))}
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More</span>
        </div>

      </div>
    </div>
  )
}
