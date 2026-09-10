import { Navigate, Route, Routes } from 'react-router-dom'
import { PersonScope } from './components/PersonScope'
import { People } from './pages/People'
import { Dashboard } from './pages/Dashboard'
import { LogWorkout } from './pages/LogWorkout'
import { Routines } from './pages/Routines'
import { Progress } from './pages/Progress'
import { Maxes } from './pages/Maxes'
import { Running } from './pages/Running'
import { Hyrox, Tri } from './pages/ComingSoon'
import { HistoryPage } from './pages/History'

export default function App() {
  return (
    <Routes>
      {/* Picking a person is the front door - every page below needs to know whose log it is. */}
      <Route path="/" element={<People />} />

      <Route path="/p/:personId" element={<PersonScope />}>
        <Route index element={<Dashboard />} />
        <Route path="log" element={<LogWorkout />} />
        <Route path="routines" element={<Routines />} />
        <Route path="progress" element={<Progress />} />
        <Route path="maxes" element={<Maxes />} />
        <Route path="running" element={<Running />} />
        <Route path="hyrox" element={<Hyrox />} />
        <Route path="tri" element={<Tri />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="*" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
