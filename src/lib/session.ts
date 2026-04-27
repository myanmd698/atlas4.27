import type { LinkedAccount } from './linkedAccounts'
import type { SubscriptionPlan } from './pricing'

export type { LinkedAccount } from './linkedAccounts'

const KEY = 'atlas_v2'
const LEGACY_KEY = 'atlas_v1'

export type OnboardingStep =
  | 'connect'
  | 'subscribe'
  | 'reasons'
  | 'complete'

export type SubscriptionStatus = 'none' | 'trialing' | 'active'

export type AppSession = {
  userId: string
  token: string
  email: string
  onboardingStep: OnboardingStep
  primaryReasonId: string | null
  /** User tapped mock “link” */
  accountsLinked: boolean
  /** Mock Plaid-linked accounts (client-only prototype) */
  linkedAccounts: LinkedAccount[]
  subscriptionPlan: SubscriptionPlan | null
  subscriptionStatus: SubscriptionStatus
  /** ISO date string when the paid period starts after trial */
  trialEndsAt: string | null
}

type LegacyOnboarding = 'reasons' | 'connect' | 'complete'
type LegacySession = {
  userId: string
  token: string
  email: string
  onboardingStep: LegacyOnboarding
  primaryReasonId: string | null
  accountsLinked: boolean
}

function defaultSession(p: {
  userId: string
  token: string
  email: string
}): AppSession {
  return {
    ...p,
    onboardingStep: 'connect',
    primaryReasonId: null,
    accountsLinked: false,
    linkedAccounts: [],
    subscriptionPlan: null,
    subscriptionStatus: 'none',
    trialEndsAt: null,
  }
}

function migrateAndClearLegacy(raw: string): AppSession | null {
  try {
    const s = JSON.parse(raw) as LegacySession
    if (!s?.token || !s?.userId) return null
    if (s.onboardingStep === 'complete') {
      return {
        userId: s.userId,
        token: s.token,
        email: s.email,
        onboardingStep: 'complete',
        primaryReasonId: s.primaryReasonId,
        accountsLinked: s.accountsLinked,
        linkedAccounts: [],
        subscriptionPlan: null,
        subscriptionStatus: 'active',
        trialEndsAt: null,
      }
    }
    return null
  } catch {
    return null
  }
}

function normalizeV2(raw: string): AppSession | null {
  try {
    const s = JSON.parse(raw) as Partial<AppSession>
    if (!s?.token || !s?.userId) return null
    if (
      s.onboardingStep !== 'connect' &&
      s.onboardingStep !== 'subscribe' &&
      s.onboardingStep !== 'reasons' &&
      s.onboardingStep !== 'complete'
    ) {
      return null
    }
    return {
      userId: s.userId,
      token: s.token,
      email: s.email ?? '',
      onboardingStep: s.onboardingStep,
      primaryReasonId: s.primaryReasonId ?? null,
      accountsLinked: s.accountsLinked ?? false,
      linkedAccounts: Array.isArray(s.linkedAccounts) ? s.linkedAccounts : [],
      subscriptionPlan: s.subscriptionPlan ?? null,
      subscriptionStatus:
        s.subscriptionStatus ??
        (s.onboardingStep === 'complete' ? 'active' : 'none'),
      trialEndsAt: s.trialEndsAt ?? null,
    }
  } catch {
    return null
  }
}

export function loadSession(): AppSession | null {
  try {
    const rawV2 = localStorage.getItem(KEY)
    if (rawV2) {
      return normalizeV2(rawV2)
    }
    const rawLegacy = localStorage.getItem(LEGACY_KEY)
    if (rawLegacy) {
      const migrated = migrateAndClearLegacy(rawLegacy)
      localStorage.removeItem(LEGACY_KEY)
      if (migrated) {
        localStorage.setItem(KEY, JSON.stringify(migrated))
      }
      return migrated
    }
    return null
  } catch {
    return null
  }
}

export function saveAfterRegister(p: {
  userId: string
  token: string
  email: string
}): void {
  localStorage.setItem(KEY, JSON.stringify(defaultSession(p)))
}

export function updateSession(partial: Partial<AppSession>): void {
  const cur = loadSession()
  if (!cur) return
  localStorage.setItem(KEY, JSON.stringify({ ...cur, ...partial }))
}

export function clearSession(): void {
  localStorage.removeItem(KEY)
  localStorage.removeItem(LEGACY_KEY)
}
