import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { LogWorkout } from './pages/LogWorkout'
import { Routines } from './pages/Routines'
import { Progress } from './pages/Progress'
import { Maxes } from './pages/Maxes'
import { HistoryPage } from './pages/History'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="log" element={<LogWorkout />} />
        <Route path="routines" element={<Routines />} />
        <Route path="progress" element={<Progress />} />
        <Route path="maxes" element={<Maxes />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
