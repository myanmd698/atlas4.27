import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'atlas_v1'

export type OnboardingStep = 'reasons' | 'connect' | 'complete'

export type AppSession = {
  userId: string
  token: string
  email: string
  onboardingStep: OnboardingStep
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
    onboardingStep: 'reasons',
    primaryReasonId: null,
    accountsLinked: false,
  }
}

export async function loadSession(): Promise<AppSession | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (raw == null) return null
    const s = JSON.parse(raw) as AppSession
    if (s?.token == null || s?.userId == null) return null
    return s
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
}
