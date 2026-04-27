import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api/client'
import { loadSession, saveAfterRegister } from '../lib/session'
import { nextOnboardingPath } from '../lib/redirects'
import { Navigate } from 'react-router-dom'

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const existing = loadSession()
  const dest = nextOnboardingPath(existing)
  if (existing && dest && dest !== '/signup') {
    return <Navigate to={dest} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    const eTrim = email.trim()
    if (!isValidEmail(eTrim)) {
      setErr('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setErr('Use at least 8 characters for your password.')
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const r = await api.register({ email: eTrim, password })
      saveAfterRegister({
        userId: r.userId,
        token: r.token,
        email: r.email,
      })
      navigate('/onboarding/connect', { replace: true })
    } catch (caught: unknown) {
      setErr(caught instanceof Error ? caught.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flow">
      <h1 className="flow__title">Create your account</h1>
      <p className="flow__lead text-muted">
        A calm place to see where you are headed—not every coffee purchase.
      </p>
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(c) => setEmail(c.target.value)}
            required
            disabled={busy}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(c) => setPassword(c.target.value)}
            minLength={8}
            required
            disabled={busy}
          />
          <span className="field__hint">At least 8 characters.</span>
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(c) => setConfirm(c.target.value)}
            required
            disabled={busy}
          />
        </div>
        {err ? (
          <p className="form__error" role="alert">
            {err}
          </p>
        ) : null}
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Continue'}
        </button>
      </form>
      <p className="flow__footer text-muted small">
        By continuing, you agree this is a prototype. No real bank link yet.
      </p>
    </div>
  )
}
