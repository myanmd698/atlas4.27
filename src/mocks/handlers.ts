import { http, HttpResponse, delay, passthrough } from 'msw'
import * as api from './apiLogic'

const jsonHeaders = { 'Content-Type': 'application/json' }

const useBillingServer =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_USE_BILLING_API === 'true'

export const handlers = [
  http.post('/api/billing/adyen/session', async ({ request }) => {
    if (useBillingServer) {
      return passthrough()
    }
    await delay(30)
    const body = (await request.json()) as api.AdyenSessionBody
    const out = await api.createBillingSession(body)
    return HttpResponse.json(out, { headers: jsonHeaders })
  }),

  http.post('/api/billing/adyen/confirm', async ({ request }) => {
    if (useBillingServer) {
      return passthrough()
    }
    await delay(50)
    const body = (await request.json()) as api.ConfirmSubscriptionBody
    const out = await api.confirmSubscription(body)
    return HttpResponse.json(out, { headers: jsonHeaders })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as api.RegisterBody
    const out = await api.register(body)
    return HttpResponse.json(out, { status: 201, headers: jsonHeaders })
  }),

  http.post('/api/onboarding/primary-reason', async ({ request }) => {
    await delay(50)
    const body = (await request.json()) as api.PrimaryReasonBody
    const out = await api.savePrimaryReason(body)
    return HttpResponse.json(out, { headers: jsonHeaders })
  }),

  http.post('/api/accounts/link', async ({ request }) => {
    const body = (await request.json()) as api.LinkBody
    const out = await api.setAccounts(body)
    return HttpResponse.json(out, { headers: jsonHeaders })
  }),

  http.get('/api/insights/summary', async () => {
    const out = await api.getInsightsSummary()
    return HttpResponse.json(out, { headers: jsonHeaders })
  }),
]
