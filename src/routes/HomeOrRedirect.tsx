import { Navigate } from 'react-router-dom'
import { loadSession } from '../lib/session'
import { nextOnboardingPath } from '../lib/redirects'
import { Landing } from './Landing'

/** Signed-out users see the marketing landing; signed-in users resume onboarding or dashboard. */
export function HomeOrRedirect() {
  const s = loadSession()
  if (s == null) return <Landing />
  return <Navigate to={nextOnboardingPath(s)} replace />
}
