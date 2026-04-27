/** Mock API for the native prototype (same contract as the web app). */
export type RegisterBody = { email: string; password: string }

export type RegisterResponse = {
  userId: string
  token: string
  email: string
}

export type PrimaryReasonBody = { reasonId: string }

export type LinkBody = { action: 'link' | 'skip' }

export type InsightsSummary = {
  asOf: string
  netWorth: number
  netWorthChange12mPct: number
  headline: string
  focusAreas: { title: string; body: string }[]
  netWorthSeries: { month: string; value: number }[]
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

function randomId() {
  return `usr_${Math.random().toString(36).slice(2, 12)}`
}

export async function register(body: RegisterBody): Promise<RegisterResponse> {
  await delay(400)
  return {
    userId: randomId(),
    token: `tkn_${Math.random().toString(36).slice(2, 20)}`,
    email: body.email,
  }
}

export async function savePrimaryReason(
  body: PrimaryReasonBody,
): Promise<{ ok: true; reasonId: string }> {
  await delay(250)
  return { ok: true, reasonId: body.reasonId }
}

export async function setAccounts(
  body: LinkBody,
): Promise<{ accountsLinked: boolean; linkedAt: string | null }> {
  await delay(300)
  if (body.action === 'link') {
    return {
      accountsLinked: true,
      linkedAt: new Date().toISOString(),
    }
  }
  return { accountsLinked: false, linkedAt: null }
}

const insights: InsightsSummary = {
  asOf: new Date().toISOString().slice(0, 10),
  netWorth: 2_420_000,
  netWorthChange12mPct: 11.2,
  headline:
    'You are up over the year with steady contributions and flat spending.',
  focusAreas: [
    {
      title: 'Direction, not line items',
      body: 'Spending is stable; growth is coming from investment contributions and your primary brokerage holding.',
    },
    {
      title: 'Milestone room',
      body: 'With current cash and invested balances, a mid-sized goal in the next 24–36 months looks feasible at your pace.',
    },
  ],
  netWorthSeries: [
    { month: '2025-05', value: 2_100_000 },
    { month: '2025-08', value: 2_240_000 },
    { month: '2025-11', value: 2_310_000 },
    { month: '2026-02', value: 2_400_000 },
    { month: '2026-04', value: 2_420_000 },
  ],
}

export async function getInsightsSummary(): Promise<InsightsSummary> {
  await delay(200)
  return { ...insights, asOf: new Date().toISOString().slice(0, 10) }
}
