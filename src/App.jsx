import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Today from './screens/Today'
import Goals from './screens/Goals'
import Review from './screens/Review'
import Stats from './screens/Stats'

export default function App() {
  const location = useLocation()
  return (
    <div className="app-shell">
      {/* keying by pathname unmounts and remounts the route on every tab switch, restarting the .screen animation */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<Today />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/review" element={<Review />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
