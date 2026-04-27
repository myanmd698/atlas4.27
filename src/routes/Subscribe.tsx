import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import * as api from '../api/client'
import { loadSession, updateSession, type AppSession } from '../lib/session'
import { nextOnboardingPath } from '../lib/redirects'
import {
  planLabel,
  type SubscriptionPlan,
} from '../lib/pricing'
import type { BillingSessionResponse } from '../mocks/apiLogic'

import '@adyen/adyen-web/styles/adyen.css'

function guard(s: AppSession | null) {
  if (!s) return '/signup' as const
  return nextOnboardingPath(s)
}

function mapEnvironment(
  e: Extract<BillingSessionResponse, { mode: 'live' }>['environment'],
): 'test' | 'live' | 'live-us' | 'live-au' | 'live-apse' | 'live-in' | 'live-nea' {
  switch (e) {
    case 'test':
    case 'us':
    case 'au':
    case 'in':
    case 'ap':
      return 'test'
    case 'live':
    default:
      return 'live'
  }
}

export function Subscribe() {
  const navigate = useNavigate()
  const s = loadSession()
  const [plan, setPlan] = useState<SubscriptionPlan>('monthly')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [session, setSession] = useState<BillingSessionResponse | null>(null)
  const [mockConfirming, setMockConfirming] = useState(false)
  const payContainerRef = useRef<HTMLDivElement>(null)
  const dropinRef = useRef<{ unmount: () => void } | null>(null)

  const afterConfirm = useCallback(
    async (body: { plan: SubscriptionPlan; paymentReference?: string }) => {
      const cur = loadSession()
      if (cur == null) return
      if (cur.onboardingStep !== 'subscribe') return
      const res = await api.confirmSubscription(
        {
          plan: body.plan,
          userId: cur.userId,
          paymentReference: body.paymentReference,
        },
        cur.token,
      )
      updateSession({
        subscriptionPlan: res.plan,
        subscriptionStatus: res.subscriptionStatus,
        trialEndsAt: res.trialEndsAt,
        onboardingStep: 'reasons',
      })
      navigate('/onboarding/why', { replace: true })
    },
    [navigate],
  )

  const startSession = useCallback(async () => {
    const cur = loadSession()
    if (cur == null) return
    setErr(null)
    setBusy(true)
    setSession(null)
    if (dropinRef.current) {
      dropinRef.current.unmount()
      dropinRef.current = null
    }
    try {
      const res = await api.createBillingSession(
        {
          plan,
          userId: cur.userId,
          email: cur.email,
        },
        cur.token,
      )
      setSession(res)
    } catch (caught: unknown) {
      setErr(
        caught instanceof Error
          ? caught.message
          : 'Could not start the payment step.',
      )
    } finally {
      setBusy(false)
    }
  }, [plan])

  useEffect(() => {
    if (!session || session.mode !== 'live') {
      return
    }
    const { id, sessionData: sData, clientKey, environment } = session
    if (!payContainerRef.current) return
    if (!clientKey || !sData) {
      setErr('Invalid payment session from the server.')
      return
    }
    const loggedIn = loadSession()
    const shopperEmail = loggedIn?.email ?? ''

    let cancelled = false
    void (async () => {
      const { AdyenCheckout, Dropin } = await import('@adyen/adyen-web')
      const core = await AdyenCheckout({
        clientKey,
        environment: mapEnvironment(environment),
        session: { id, sessionData: sData, shopperEmail },
        onPaymentCompleted: (result) => {
          const ref = (result as { merchantReference?: string })
            .merchantReference
          void (async () => {
            try {
              await afterConfirm({ plan, paymentReference: ref })
            } catch (caught: unknown) {
              setErr(
                caught instanceof Error
                  ? caught.message
                  : 'Could not finish signup.',
              )
            }
          })()
        },
        onPaymentFailed: (fail) => {
          if (fail && typeof fail === 'object' && 'message' in fail) {
            setErr(String((fail as { message: string }).message))
            return
          }
          if (fail && typeof fail === 'object' && 'resultCode' in fail) {
            setErr(`Payment failed (${String((fail as { resultCode: string }).resultCode)}).`)
            return
          }
          setErr('Payment was not successful.')
        },
        onError: (e) => {
          if (e?.message) setErr(e.message)
        },
      })
      if (cancelled) {
        return
      }
      const d = new Dropin(core, {})
      void d.mount(payContainerRef.current!)
      dropinRef.current = d
    })()
    return () => {
      cancelled = true
      if (dropinRef.current) {
        dropinRef.current.unmount()
        dropinRef.current = null
      }
    }
  }, [afterConfirm, plan, session])

  const redirect = guard(s)
  if (s == null) return <Navigate to={redirect} replace />
  if (s.onboardingStep !== 'subscribe') {
    return <Navigate to={redirect} replace />
  }

  async function onMockStartTrial() {
    setErr(null)
    setMockConfirming(true)
    try {
      await afterConfirm({ plan })
    } catch (caught: unknown) {
      setErr(
        caught instanceof Error ? caught.message : 'Could not continue.',
      )
    } finally {
      setMockConfirming(false)
    }
  }

  return (
    <div className="flow">
      <h1 className="flow__title">Start your 7-day free trial</h1>
      <p className="flow__lead text-muted">
        No charge today. After the trial, your plan is{' '}
        <strong>$15/month</strong> or <strong>$99/year</strong> (billed
        annually). Cancel before the trial ends to avoid being charged. By
        subscribing you accept our terms and the trial policy.
      </p>

      <div className="field">
        <span className="field__label" id="planLabel">
          Plan
        </span>
        <div className="stack plan-row" role="group" aria-labelledby="planLabel">
          {(['monthly', 'annual'] as const).map((p) => (
            <label
              key={p}
              className={
                'option option--row' + (plan === p ? ' option--active' : '')
              }
            >
              <input
                type="radio"
                name="plan"
                value={p}
                checked={plan === p}
                onChange={() => {
                  setPlan(p)
                }}
                disabled={busy}
              />
              <span className="option__text">
                <span className="option__title">
                  {p === 'monthly' ? 'Monthly' : 'Annual'}
                </span>
                <span className="option__blurb text-muted">
                  {planLabel(p)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {err ? (
        <p className="form__error" role="alert">
          {err}
        </p>
      ) : null}

      {session == null ? (
        <div className="stack">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void startSession()}
            disabled={busy}
          >
            {busy ? 'Preparing…' : 'Add payment method'}
          </button>
        </div>
      ) : session.mode === 'mock' ? (
        <div className="stack">
          <p className="banner" role="status">
            {session.message} Use the action below to simulate a successful
            trial setup.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void onMockStartTrial()}
            disabled={mockConfirming}
          >
            {mockConfirming
              ? 'Setting up your trial…'
              : 'Start 7-day free trial (demo)'}
          </button>
        </div>
      ) : (
        <div
          className="adyen-mount"
          ref={payContainerRef}
          data-testid="adyen-container"
        />
      )}

      <p className="flow__footer text-muted small">
        Payments are processed with Adyen. The first charge is scheduled for
        after your trial unless you cancel.
      </p>
    </div>
  )
}
