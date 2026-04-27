import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import * as api from '../api/client'
import { loadSession, updateSession, type AppSession } from '../lib/session'
import { nextOnboardingPath } from '../lib/redirects'
import { PRIMARY_REASONS, type PrimaryReasonId } from './reasons'

function guard(s: AppSession | null) {
  if (!s) return '/signup' as const
  return nextOnboardingPath(s)
}

export function OnboardingReasons() {
  const navigate = useNavigate()
  const s = loadSession()
  const [reasonId, setReasonId] = useState<PrimaryReasonId | ''>('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const redirect = guard(s)
  if (s == null) return <Navigate to={redirect} replace />
  if (s.onboardingStep !== 'reasons') {
    return <Navigate to={redirect} replace />
  }
  const session = s

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!reasonId) {
      setErr('Choose one option so we can tailor the experience.')
      return
    }
    setBusy(true)
    try {
      await api.savePrimaryReason(reasonId, session.token)
      updateSession({
        primaryReasonId: reasonId,
        onboardingStep: 'complete',
      })
      navigate('/dashboard', { replace: true })
    } catch (caught: unknown) {
      setErr(caught instanceof Error ? caught.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flow">
      <h1 className="flow__title">What brings you to North today?</h1>
      <p className="flow__lead text-muted">
        We use this to prioritize what you see first—one choice is enough for now.
      </p>
      <form className="form" onSubmit={onSubmit}>
        <fieldset className="field field--options" disabled={busy}>
          <legend className="visually-hidden">Main goal</legend>
          {PRIMARY_REASONS.map((r) => (
            <label
              key={r.id}
              className={
                'option' + (reasonId === r.id ? ' option--active' : '')
              }
            >
              <input
                type="radio"
                name="reason"
                value={r.id}
                checked={reasonId === r.id}
                onChange={() => {
                  setReasonId(r.id)
                }}
              />
              <span className="option__text">
                <span className="option__title">{r.title}</span>
                <span className="option__blurb text-muted">{r.blurb}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {err ? (
          <p className="form__error" role="alert">
            {err}
          </p>
        ) : null}
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
