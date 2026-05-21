// useGoals.js — Central data hook for Momentum
// Completed: May 20, 2026
//
// This is the most important file in the app. Every screen pulls from this hook
// to read and write goal data. Everything is persisted to localStorage so it
// survives page refreshes without needing a backend or user account.
//
// What lives here:
//   - Goals list (daily, weekly, monthly, yearly)
//   - Completions log (which goals were checked off on which dates)
//   - Streak freeze system (earn 1 shield per week, use to protect a missed day)
//   - Streak calculator (counts consecutive days with at least 1 completion or a freeze)

import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

// Returns a "YYYY-WNN" string for the current ISO week, e.g. "2026-W21"
// Used to track which week the user last earned a streak freeze, so we only
// award one per week regardless of how many times the app loads.
function getWeekKey() {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function useGoals() {
  // All four localStorage keys that make up the app's data layer.
  // Using a custom useLocalStorage hook so React re-renders whenever
  // any of these change, and writes are automatically persisted.
  const [goals, setGoals] = useLocalStorage('momentum_goals', [])
  const [completions, setCompletions] = useLocalStorage('momentum_completions', [])
  const [frozenDays, setFrozenDays] = useLocalStorage('momentum_frozen', [])

  // freezeData tracks { count: number, lastEarnedWeek: string }
  // Users start with 1 freeze and can hold up to 2 at a time.
  const [freezeData, setFreezeData] = useLocalStorage('momentum_freezes', { count: 1, lastEarnedWeek: '' })

  // Recomputed each render so the date stays accurate if the app is left open past midnight.
  const today = new Date().toISOString().slice(0, 10)
  const currentWeek = getWeekKey()

  // Award one streak freeze at the start of each new calendar week, capped at 2.
  // Using useEffect so this doesn't run during render — state updates during render
  // cause infinite re-render loops in React.
  useEffect(() => {
    setFreezeData(prev => {
      // Already earned this week — do nothing
      if (prev.lastEarnedWeek === currentWeek) return prev
      return { count: Math.min((prev.count ?? 0) + 1, 2), lastEarnedWeek: currentWeek }
    })
  }, [currentWeek]) // eslint-disable-line react-hooks/exhaustive-deps

  // Adds a new goal to the list. crypto.randomUUID() gives us a collision-proof
  // ID without needing a database sequence.
  function addGoal(title, type) {
    const goal = {
      id: crypto.randomUUID(),
      title: title.trim(),
      type,
      createdAt: new Date().toISOString(),
    }
    setGoals(prev => [...prev, goal])
    return goal
  }

  // Deletes the goal AND cleans up its completions so orphaned records don't
  // silently inflate future stats. This was a deliberate design choice —
  // if we only deleted the goal, old completion data would stick around and
  // mess up the heatmap and monthly stats.
  function deleteGoal(id) {
    setGoals(prev => prev.filter(g => g.id !== id))
    setCompletions(prev => prev.filter(c => c.goalId !== id))
  }

  // Simple lookup — checks if a specific goal was completed on a specific date.
  // Used heavily by the Today screen, Review screen, and heatmap.
  function isCompletedOn(goalId, date) {
    return completions.some(c => c.goalId === goalId && c.date === date)
  }

  // Toggles a goal's completion for a given date (defaults to today).
  // Tapping a completed goal unchecks it, tapping an incomplete one checks it.
  function toggleCompletion(goalId, date = today) {
    if (isCompletedOn(goalId, date)) {
      setCompletions(prev => prev.filter(c => !(c.goalId === goalId && c.date === date)))
    } else {
      setCompletions(prev => [...prev, { goalId, date }])
    }
  }

  // Convenience filter — the Today screen and streak logic only care about daily goals.
  function getDailyGoals() {
    return goals.filter(g => g.type === 'daily')
  }

  // Returns true if the user has already used a streak freeze to protect this date.
  function isDayFrozen(date) {
    return frozenDays.includes(date)
  }

  // Spends one streak freeze to protect a missed day. Returns false if the user
  // has no freezes left, or the day is already frozen. Called from the Stats screen
  // when the yellow "Use shield" banner is visible.
  function freezeDay(date) {
    if (freezeData.count < 1 || frozenDays.includes(date)) return false
    setFrozenDays(prev => [...prev, date])
    setFreezeData(prev => ({ ...prev, count: prev.count - 1 }))
    return true
  }

  // Counts consecutive days where the user either completed at least one daily goal
  // OR used a streak freeze. Walks backwards from today until it hits a day with neither.
  // We use "at least one goal" rather than "all goals" so the streak feels achievable
  // even on busy days — losing a streak over one missed task kills motivation.
  function getStreak() {
    const daily = getDailyGoals()
    if (daily.length === 0) return 0
    let streak = 0
    const d = new Date()
    while (true) {
      const dateStr = d.toISOString().slice(0, 10)
      const hasCompletion = daily.some(g => isCompletedOn(g.id, dateStr))
      if (!hasCompletion && !isDayFrozen(dateStr)) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  return {
    goals,
    completions,
    frozenDays,
    today,
    freezeCount: freezeData.count,
    addGoal,
    deleteGoal,
    toggleCompletion,
    isCompletedOn,
    getDailyGoals,
    isDayFrozen,
    freezeDay,
    getStreak,
  }
}
