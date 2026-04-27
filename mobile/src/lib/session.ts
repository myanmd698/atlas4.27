import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SubscriptionPlan } from './pricing'

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
  accountsLinked: boolean
  subscriptionPlan: SubscriptionPlan | null
  subscriptionStatus: SubscriptionStatus
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
    subscriptionPlan: null,
    subscriptionStatus: 'none',
    trialEndsAt: null,
  }
}

function migrateAndClearLegacy(raw: string): AppSession | null {
  try {
    const s = JSON.parse(raw) as LegacySession
    if (s?.token == null || s?.userId == null) return null
    if (s.onboardingStep === 'complete') {
      return {
        userId: s.userId,
        token: s.token,
        email: s.email,
        onboardingStep: 'complete',
        primaryReasonId: s.primaryReasonId,
        accountsLinked: s.accountsLinked,
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
    if (s?.token == null || s?.userId == null) return null
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

export async function loadSession(): Promise<AppSession | null> {
  try {
    const rawV2 = await AsyncStorage.getItem(KEY)
    if (rawV2 != null) {
      return normalizeV2(rawV2)
    }
    const rawLegacy = await AsyncStorage.getItem(LEGACY_KEY)
    if (rawLegacy != null) {
      const migrated = migrateAndClearLegacy(rawLegacy)
      await AsyncStorage.removeItem(LEGACY_KEY)
      if (migrated != null) {
        await AsyncStorage.setItem(KEY, JSON.stringify(migrated))
      }
      return migrated
    }
    return null
  } catch {
    return null
  }
}

export async function saveAfterRegister(p: {
  userId: string
  token: string
  email: string
}): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(defaultSession(p)))
}

export async function updateSession(
  partial: Partial<AppSession>,
): Promise<void> {
  const cur = await loadSession()
  if (cur == null) return
  await AsyncStorage.setItem(KEY, JSON.stringify({ ...cur, ...partial }))
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(KEY)
  await AsyncStorage.removeItem(LEGACY_KEY)
}
