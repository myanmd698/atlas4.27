/**
 * Minimal billing API: Adyen Checkout /sessions, subscription confirm, webhooks, trial scheduler.
 * Set ADYEN_API_KEY, ADYEN_MERCHANT_ACCOUNT, ADYEN_CLIENT_KEY, FRONTEND_ORIGIN (e.g. http://localhost:5173).
 * Without these, the session route returns the same "mock" shape the MSW dev handler uses.
 */
import 'dotenv/config'
import cors from 'cors'
import { createHmac, timingSafeEqual } from 'crypto'
import express from 'express'

const PORT = Number(process.env.PORT) || 3001
const TRIAL_DAYS = 7
const ADYEN_VERSION = 71
const ADYEN_HOST =
  process.env.ADYEN_CHECKOUT_HOST || 'https://checkout-test.adyen.com'

/** In-memory "DB": userId -> subscription */
const subs = new Map()
const princingMinor = { monthly: 1500, annual: 9900 }

function hasBearer(req) {
  return typeof req.headers.authorization === 'string' &&
    req.headers.authorization.startsWith('Bearer ')
}

function addTrialEnd() {
  const d = new Date()
  d.setDate(d.getDate() + TRIAL_DAYS)
  return d.toISOString()
}

const app = express()
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'HmacSignature'],
  }),
)

// --- Adyen HMAC: register before express.json() so the raw body is intact ---
app.post(
  '/api/billing/adyen/webhook',
  express.text({ type: 'application/json', limit: '1mb' }),
  (req, res) => {
    const secret = process.env.ADYEN_HMAC_KEY
    const hmacHeader = req.get('HmacSignature') || req.get('hmacsignature') || ''
    if (secret && hmacHeader) {
      const expected = createHmac('sha256', Buffer.from(secret, 'utf8'))
        .update(req.body, 'utf8')
        .digest('base64')
      try {
        const a = Buffer.from(expected)
        const b = Buffer.from(hmacHeader, 'base64')
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return res.status(401).end()
        }
      } catch {
        return res.status(401).end()
      }
    }
    let parsed
    try {
      parsed = JSON.parse(req.body)
    } catch {
      // ignore
    }
    if (process.env.BILLING_DEBUG) {
      console.log('[webhook]', JSON.stringify(parsed, null, 0))
    }
    res
      .status(200)
      .set('Content-Type', 'text/plain')
      .send("[accepted]")
  },
)

app.use(express.json())

app.post('/api/billing/adyen/confirm', (req, res) => {
  if (!hasBearer(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { plan, userId, paymentReference } = req.body || {}
  if (!userId || !plan || (plan !== 'monthly' && plan !== 'annual')) {
    return res.status(400).json({ error: 'Invalid body' })
  }
  const trialEndsAt = addTrialEnd()
  const row = {
    userId,
    plan,
    status: 'trialing',
    trialEndsAt,
    paymentReference: paymentReference ?? null,
  }
  subs.set(userId, row)
  res.json({
    ok: true,
    subscriptionStatus: 'trialing',
    trialEndsAt,
    plan,
  })
})

app.post('/api/billing/adyen/session', async (req, res) => {
  if (!hasBearer(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const { plan, userId, email } = req.body || {}
  if (!userId || !email || (plan !== 'monthly' && plan !== 'annual')) {
    return res.status(400).json({ error: 'Invalid body' })
  }
  const apiKey = process.env.ADYEN_API_KEY
  const merchantAccount = process.env.ADYEN_MERCHANT_ACCOUNT
  const clientKey = process.env.ADYEN_CLIENT_KEY
  const returnUrl = `${(process.env.FRONTEND_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')}/onboarding/subscribe`

  if (!apiKey || !merchantAccount || !clientKey) {
    return res.json({
      mode: 'mock',
      plan,
      message:
        'Set ADYEN_API_KEY, ADYEN_MERCHANT_ACCOUNT, and ADYEN_CLIENT_KEY to load real Adyen Drop-in.',
    })
  }

  const ref = `sub_${userId}_${Date.now()}`
  const body = {
    amount: { currency: 'USD', value: 0 },
    reference: ref,
    returnUrl,
    merchantAccount,
    countryCode: 'US',
    shopperReference: String(userId),
    shopperEmail: String(email),
    storePaymentMethod: true,
    recurringProcessingModel: 'Subscription',
  }

  try {
    const r = await fetch(
      `${ADYEN_HOST}/v${ADYEN_VERSION}/sessions`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    )
    const j = await r.json()
    if (!r.ok) {
      return res
        .status(502)
        .json({ error: j?.message || j?.title || 'Adyen error', detail: j })
    }
    const id = j.id
    const sessionData = j.sessionData
    if (typeof id !== 'string' || typeof sessionData !== 'string') {
      return res
        .status(502)
        .json({ error: 'Invalid Adyen session response', detail: j })
    }
    return res.json({
      mode: 'live',
      id,
      sessionData,
      clientKey,
      environment: 'test',
      returnUrl,
    })
  } catch (e) {
    return res
      .status(502)
      .json({ error: e?.message || 'Network error' })
  }
})

function runScheduler() {
  for (const [userId, row] of subs) {
    if (row.status !== 'trialing') continue
    if (new Date(row.trialEndsAt) > new Date()) continue
    // First billable charge would run here via Adyen /payments (ContAuth).
    console.log(
      `[scheduler] trial ended for ${userId}; would charge ${
        princingMinor[row.plan] / 100
      } USD`,
    )
    row.status = 'active'
    row.nextCharge = addPeriod(row.plan, row.trialEndsAt)
  }
}

function addPeriod(plan, fromIso) {
  const d = new Date(fromIso)
  if (plan === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return d.toISOString()
}

setInterval(() => {
  runScheduler()
}, 30_000)
runScheduler()

app.listen(PORT, () => {
  console.log(`[billing] listening on ${PORT}`)
})
