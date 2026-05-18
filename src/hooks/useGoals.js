import { useLocalStorage } from './useLocalStorage'

export function useGoals() {
  const [goals, setGoals] = useLocalStorage('momentum_goals', [])
  const [completions, setCompletions] = useLocalStorage('momentum_completions', [])

  // computed each render so it stays accurate if the app is left open past midnight
  const today = new Date().toISOString().slice(0, 10)

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

  function deleteGoal(id) {
    setGoals(prev => prev.filter(g => g.id !== id))
    // clean up completions too, otherwise they pile up with no goal to match
    setCompletions(prev => prev.filter(c => c.goalId !== id))
  }

  function isCompletedOn(goalId, date) {
    return completions.some(c => c.goalId === goalId && c.date === date)
  }

  function toggleCompletion(goalId, date = today) {
    if (isCompletedOn(goalId, date)) {
      setCompletions(prev => prev.filter(c => !(c.goalId === goalId && c.date === date)))
    } else {
      setCompletions(prev => [...prev, { goalId, date }])
    }
  }

  function getDailyGoals() {
    return goals.filter(g => g.type === 'daily')
  }

  return {
    goals,
    completions,
    today,
    addGoal,
    deleteGoal,
    toggleCompletion,
    isCompletedOn,
    getDailyGoals,
  }
}
