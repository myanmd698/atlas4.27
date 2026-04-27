import type { AppSession } from './session'

export type InitialScreenName =
  | 'SignUp'
  | 'OnboardingConnect'
  | 'OnboardingSubscribe'
  | 'OnboardingWhy'
  | 'Dashboard'

export function getInitialScreenName(s: AppSession | null): InitialScreenName {
  if (s == null) return 'SignUp'
  if (s.onboardingStep === 'complete') return 'Dashboard'
  if (s.onboardingStep === 'reasons') return 'OnboardingWhy'
  if (s.onboardingStep === 'subscribe') return 'OnboardingSubscribe'
  if (s.onboardingStep === 'connect') return 'OnboardingConnect'
  return 'SignUp'
}
