import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import * as api from '../api/client'
import { loadSession, updateSession, type AppSession } from '../lib/session'
import { nextOnboardingPath } from '../lib/redirects'

function guard(s: AppSession | null) {
  if (!s) return '/signup' as const
  return nextOnboardingPath(s)
}

export function ConnectAccounts() {
  const navigate = useNavigate()
  const s = loadSession()
  const [busy, setBusy] = useState(false)
  const [linking, setLinking] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const redirect = guard(s)
  if (s == null) return <Navigate to={redirect} replace />
  if (s.onboardingStep !== 'connect') {
    return <Navigate to={redirect} replace />
  }
  const session = s

  async function finish(
    action: 'link' | 'skip',
  ) {
    setErr(null)
    if (action === 'link') setLinking(true)
    else setBusy(true)
    try {
      const res = await api.linkAccounts(action, session.token)
      updateSession({
        onboardingStep: 'subscribe',
        accountsLinked: res.accountsLinked,
      })
      navigate('/onboarding/subscribe', { replace: true })
    } catch (caught: unknown) {
      setErr(
        caught instanceof Error ? caught.message : 'Could not continue.',
      )
    } finally {
      setLinking(false)
      setBusy(false)
    }
  }

  return (
    <div className="flow">
      <h1 className="flow__title">Link your accounts (optional)</h1>
      <p className="flow__lead text-muted">
        Connect with Plaid so Qapital Atlas can read balances and keep your summary
        up to date. In this prototype, <strong>Link accounts</strong> simulates
        a successful connect—you still see the same sample insights either way.
      </p>
      {err ? (
        <p className="form__error" role="alert">
          {err}
        </p>
      ) : null}
      <div className="stack">
        <button
          className="btn btn--primary"
          type="button"
          onClick={() => void finish('link')}
          disabled={busy || linking}
        >
          {linking ? 'Linking (mock)…' : 'Link accounts'}
        </button>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => void finish('skip')}
          disabled={busy || linking}
        >
          {busy ? 'Skipping…' : 'Skip for now'}
        </button>
      </div>
      <p className="flow__footer text-muted small">
        Real Plaid integration and bank connections are a follow-up; no data
        leaves your device except to this demo mock in your browser.
      </p>
    </div>
  )
}
