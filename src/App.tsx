import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { ConnectAccounts } from './routes/ConnectAccounts'
import { Dashboard } from './routes/Dashboard'
import { OnboardingReasons } from './routes/OnboardingReasons'
import { HomeOrRedirect } from './routes/HomeOrRedirect'
import { SignUp } from './routes/SignUp'
import { Subscribe } from './routes/Subscribe'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<HomeOrRedirect />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/onboarding/why" element={<OnboardingReasons />} />
          <Route path="/onboarding/subscribe" element={<Subscribe />} />
          <Route path="/onboarding/connect" element={<ConnectAccounts />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
