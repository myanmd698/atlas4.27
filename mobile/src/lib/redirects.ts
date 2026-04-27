import type { AppSession } from './session'

export type InitialScreenName =
  | 'SignUp'
  | 'OnboardingWhy'
  | 'OnboardingConnect'
  | 'Dashboard'

export function getInitialScreenName(s: AppSession | null): InitialScreenName {
  if (s == null) return 'SignUp'
  if (s.onboardingStep === 'complete') return 'Dashboard'
  if (s.onboardingStep === 'connect') return 'OnboardingConnect'
  if (s.onboardingStep === 'reasons') return 'OnboardingWhy'
  return 'SignUp'
}
