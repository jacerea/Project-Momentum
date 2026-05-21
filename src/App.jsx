// App.jsx — Root component and routing shell
// Completed: May 20, 2026
//
// This file wires together all the top-level pieces of the app:
//   - TopNav: the fixed header bar with brand name and navigation links
//   - Route definitions: maps URL paths to screen components
//   - Onboarding: the welcome modal shown once to first-time users
//   - GoalCoach: the floating AI chat button available on every screen
//
// The app started as a mobile-first layout (480px max-width, bottom nav) and was
// reworked on May 20, 2026 into a website layout with a top nav and 960px max-width.
// The screen-level animation (screenEnter keyframe) is triggered by keying the
// Routes component on location.pathname — this unmounts and remounts the active
// screen on every tab switch, restarting the animation fresh each time.

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import TopNav from './components/BottomNav'       // File kept as BottomNav.jsx but exports TopNav
import Onboarding from './components/Onboarding'
import GoalCoach from './components/GoalCoach'
import Today from './screens/Today'
import Goals from './screens/Goals'
import Review from './screens/Review'
import Stats from './screens/Stats'
import { useLocalStorage } from './hooks/useLocalStorage'

export default function App() {
  const location = useLocation()

  // Track whether the user has completed onboarding in localStorage.
  // 'momentum_onboarded' starts as false on a new device, so the Onboarding
  // modal appears automatically. Once dismissed it's set to true and never shown again.
  const [onboarded, setOnboarded] = useLocalStorage('momentum_onboarded', false)

  return (
    <>
      {/* Fixed top navigation bar — sits above all screen content */}
      <TopNav />

      {/* Centered content shell — max 960px wide, scrolls independently */}
      <div className="app-shell">
        {/*
          Keying Routes on pathname causes the entire subtree to unmount and remount
          on every navigation, which restarts the screenEnter CSS animation so each
          screen slides up fresh when you switch tabs.
        */}
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/review" element={<Review />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </div>

      {/* Onboarding modal — only renders when the user hasn't set up their goals yet */}
      {!onboarded && <Onboarding onComplete={() => setOnboarded(true)} />}

      {/* AI chat button — fixed bottom-right, visible on all screens */}
      <GoalCoach />
    </>
  )
}
