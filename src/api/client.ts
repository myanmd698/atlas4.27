import * as apiLogic from '../mocks/apiLogic'

const API = '/api'

const json = { 'Content-Type': 'application/json' } as const

function withAuth(token: string) {
  return { ...json, Authorization: `Bearer ${token}` } as const
}

function useNetworkInDev() {
  return import.meta.env.DEV
}

export async function register(
  body: apiLogic.RegisterBody,
): Promise<apiLogic.RegisterResponse> {
  if (useNetworkInDev()) {
    const r = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error('Could not create account. Try again.')
    return (await r.json()) as apiLogic.RegisterResponse
  }
  return apiLogic.register(body)
}

export async function savePrimaryReason(
  reasonId: string,
  token: string,
): Promise<void> {
  if (useNetworkInDev()) {
    const r = await fetch(`${API}/onboarding/primary-reason`, {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify({ reasonId } satisfies apiLogic.PrimaryReasonBody),
    })
    if (!r.ok) throw new Error('Could not save your selection.')
    return
  }
  await apiLogic.savePrimaryReason({ reasonId })
}

export async function linkAccounts(
  action: 'link' | 'skip',
  token: string,
): Promise<{ accountsLinked: boolean; linkedAt: string | null }> {
  if (useNetworkInDev()) {
    const r = await fetch(`${API}/accounts/link`, {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify({ action } satisfies apiLogic.LinkBody),
    })
    if (!r.ok) throw new Error('Could not update account link status.')
    return (await r.json()) as { accountsLinked: boolean; linkedAt: string | null }
  }
  return apiLogic.setAccounts({ action })
}

export async function getInsightsSummary(
  token: string,
): Promise<apiLogic.InsightsSummary> {
  if (useNetworkInDev()) {
    const r = await fetch(`${API}/insights/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) throw new Error('Could not load summary.')
    return (await r.json()) as apiLogic.InsightsSummary
  }
  return apiLogic.getInsightsSummary()
}

export async function createBillingSession(
  body: apiLogic.AdyenSessionBody,
  token: string,
): Promise<apiLogic.BillingSessionResponse> {
  if (useNetworkInDev()) {
    const r = await fetch(`${API}/billing/adyen/session`, {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(body),
    })
    if (!r.ok) {
      const t = await r.text()
      throw new Error(t || 'Could not start the payment step.')
    }
    return (await r.json()) as apiLogic.BillingSessionResponse
  }
  return apiLogic.createBillingSession(body)
}

export async function confirmSubscription(
  body: apiLogic.ConfirmSubscriptionBody,
  token: string,
): Promise<apiLogic.ConfirmSubscriptionResponse> {
  if (useNetworkInDev()) {
    const r = await fetch(`${API}/billing/adyen/confirm`, {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error('Could not confirm your subscription.')
    return (await r.json()) as apiLogic.ConfirmSubscriptionResponse
  }
  return apiLogic.confirmSubscription(body)
}
