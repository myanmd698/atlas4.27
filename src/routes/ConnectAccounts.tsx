import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import * as api from '../api/client'
import {
  ACCOUNT_CATEGORIES,
  institutionsByCategory,
  mockAccountsForLink,
} from '../data/mockPlaidInstitutions'
import type { AccountCategory } from '../lib/linkedAccounts'
import { loadSession, updateSession, type AppSession } from '../lib/session'
import { nextOnboardingPath } from '../lib/redirects'

function guard(s: AppSession | null) {
  if (!s) return '/signup' as const
  return nextOnboardingPath(s)
}

type Phase = 'categories' | 'institutions' | 'linking' | 'summary'

const LINK_DELAY_MS = 600

function groupByInstitution(
  accounts: AppSession['linkedAccounts'],
): { institutionId: string; institutionName: string; rows: typeof accounts }[] {
  const map = new Map<
    string,
    { institutionId: string; institutionName: string; rows: typeof accounts }
  >()
  for (const a of accounts) {
    const key = a.institutionId
    let g = map.get(key)
    if (!g) {
      g = {
        institutionId: a.institutionId,
        institutionName: a.institutionName,
        rows: [],
      }
      map.set(key, g)
    }
    g.rows.push(a)
  }
  return [...map.values()]
}

export function ConnectAccounts() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>(() =>
    (loadSession()?.linkedAccounts?.length ?? 0) > 0 ? 'summary' : 'categories',
  )
  const [selectedCategory, setSelectedCategory] =
    useState<AccountCategory | null>(null)
  const [busy, setBusy] = useState(false)
  const [linking, setLinking] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [, setRevision] = useState(0)

  const s = loadSession()
  const redirect = guard(s)
  const linkedAccounts = s?.linkedAccounts ?? []
  const grouped = useMemo(
    () => groupByInstitution(linkedAccounts),
    [linkedAccounts],
  )

  if (s == null) return <Navigate to={redirect} replace />
  if (s.onboardingStep !== 'connect') {
    return <Navigate to={redirect} replace />
  }

  const session = s

  async function finishLinkAndAdvance() {
    setErr(null)
    setLinking(true)
    try {
      const res = await api.linkAccounts('link', session.token)
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
    }
  }

  async function skip() {
    setErr(null)
    setBusy(true)
    try {
      const res = await api.linkAccounts('skip', session.token)
      updateSession({
        onboardingStep: 'subscribe',
        accountsLinked: res.accountsLinked,
        linkedAccounts: [],
      })
      navigate('/onboarding/subscribe', { replace: true })
    } catch (caught: unknown) {
      setErr(
        caught instanceof Error ? caught.message : 'Could not continue.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function onSelectInstitution(institutionId: string) {
    if (selectedCategory == null) return
    const list = institutionsByCategory[selectedCategory]
    const institution = list.find((i) => i.id === institutionId)
    if (!institution) return

    setErr(null)
    setPhase('linking')
    setLinking(true)
    try {
      await new Promise((r) => setTimeout(r, LINK_DELAY_MS))
      const newRows = mockAccountsForLink(institution, selectedCategory)
      const cur = loadSession()
      if (!cur || cur.onboardingStep !== 'connect') return
      const merged = [...cur.linkedAccounts, ...newRows]
      updateSession({ linkedAccounts: merged })
      setRevision((t) => t + 1)
      setPhase('summary')
    } catch (caught: unknown) {
      setErr(
        caught instanceof Error ? caught.message : 'Could not link account.',
      )
      setPhase('institutions')
    } finally {
      setLinking(false)
    }
  }

  function goToCategories() {
    setSelectedCategory(null)
    setPhase('categories')
  }

  function goBackToCategoriesFromInstitutions() {
    setSelectedCategory(null)
    setPhase('categories')
  }

  const categoryLabel =
    selectedCategory != null
      ? ACCOUNT_CATEGORIES.find((c) => c.id === selectedCategory)?.label ??
        selectedCategory
      : ''

  return (
    <div className="flow">
      {phase === 'categories' ? (
        <>
          <h1 className="flow__title">Link your accounts (optional)</h1>
          <p className="flow__lead text-muted">
            Choose an account type, then pick an institution. We simulate Plaid
            Link in this prototype—no real bank credentials are sent.
          </p>
        </>
      ) : null}

      {phase === 'institutions' ? (
        <>
          <h1 className="flow__title">{categoryLabel}</h1>
          <p className="flow__lead text-muted">
            Select an institution to connect. Each choice runs a mock link flow.
          </p>
        </>
      ) : null}

      {phase === 'linking' ? (
        <>
          <h1 className="flow__title">Connecting…</h1>
          <p className="flow__lead text-muted">
            Simulating Plaid Link with {categoryLabel}…
          </p>
        </>
      ) : null}

      {phase === 'summary' ? (
        <>
          <h1 className="flow__title">Connected accounts</h1>
          <p className="flow__lead text-muted">
            Accounts are grouped by institution. You can link more or continue
            to subscription.
          </p>
        </>
      ) : null}

      {err ? (
        <p className="form__error" role="alert">
          {err}
        </p>
      ) : null}

      {phase === 'categories' ? (
        <>
          <div className="connect-cats" role="list">
            {ACCOUNT_CATEGORIES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className="connect-cats__tile"
                onClick={() => {
                  setSelectedCategory(id)
                  setPhase('institutions')
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="stack connect-actions">
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => void skip()}
              disabled={busy || linking}
            >
              {busy ? 'Skipping…' : 'Skip for now'}
            </button>
          </div>
          <p className="flow__footer text-muted small">
            Real Plaid integration is a follow-up; linking is mocked in your
            browser.
          </p>
        </>
      ) : null}

      {phase === 'institutions' && selectedCategory != null ? (
        <>
          <div className="connect-inst-list" role="list">
            {institutionsByCategory[selectedCategory].map((ins) => (
              <button
                key={ins.id}
                type="button"
                className="connect-inst-list__row"
                onClick={() => void onSelectInstitution(ins.id)}
                disabled={linking}
              >
                <span className="connect-inst-list__name">{ins.name}</span>
                <span className="connect-inst-list__chev" aria-hidden>
                  →
                </span>
              </button>
            ))}
          </div>
          <div className="stack">
            <button
              className="btn btn--ghost"
              type="button"
              onClick={goBackToCategoriesFromInstitutions}
              disabled={linking}
            >
              Back
            </button>
          </div>
        </>
      ) : null}

      {phase === 'linking' ? (
        <p className="text-muted" aria-live="polite">
          {linking ? 'Linking (mock)…' : null}
        </p>
      ) : null}

      {phase === 'summary' ? (
        <>
          <div className="connect-summary">
            {grouped.map((g) => (
              <section key={g.institutionId} className="connect-summary__group">
                <h2 className="connect-summary__inst">{g.institutionName}</h2>
                <ul className="connect-summary__accounts">
                  {g.rows.map((row) => (
                    <li key={row.id} className="connect-summary__row">
                      <span className="connect-summary__acct">{row.name}</span>
                      <span className="connect-summary__mask text-muted">
                        ····{row.mask}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="stack connect-actions">
            <button
              className="btn btn--primary"
              type="button"
              onClick={goToCategories}
              disabled={busy || linking}
            >
              Link another account
            </button>
            <button
              className="btn btn--ghost btn--compact"
              type="button"
              onClick={() => void finishLinkAndAdvance()}
              disabled={busy || linking}
            >
              {linking ? 'Continuing…' : 'Continue'}
            </button>
          </div>
          <p className="flow__footer text-muted small">
            Continue saves your mock connections and moves to the next step.
          </p>
        </>
      ) : null}
    </div>
  )
}
