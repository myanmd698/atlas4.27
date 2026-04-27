import { Navigate } from 'react-router-dom'
import { loadSession } from '../lib/session'
import { nextOnboardingPath } from '../lib/redirects'

export function RootRedirect() {
  const s = loadSession()
  if (s == null) return <Navigate to="/signup" replace />
  return <Navigate to={nextOnboardingPath(s)} replace />
}
