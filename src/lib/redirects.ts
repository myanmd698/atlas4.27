import type { AppSession } from './session'

/** Next path the app should be on (always defined). */
export function nextOnboardingPath(s: AppSession | null): string {
  if (!s) return '/signup'
  if (s.onboardingStep === 'complete') return '/dashboard'
  if (s.onboardingStep === 'reasons') return '/onboarding/why'
  if (s.onboardingStep === 'subscribe') return '/onboarding/subscribe'
  if (s.onboardingStep === 'connect') return '/onboarding/connect'
  return '/signup'
}
