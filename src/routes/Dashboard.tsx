import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import type { InsightsSummary } from '../mocks/apiLogic'
import * as api from '../api/client'
import { loadSession, updateSession } from '../lib/session'
import { nextOnboardingPath } from '../lib/redirects'
import { PRIMARY_REASONS } from './reasons'

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function TrendChart({ series }: { series: InsightsSummary['netWorthSeries'] }) {
  const path = useMemo(():
    | { kind: 'empty' }
    | { kind: 'ok'; fillD: string; lineD: string } => {
    if (series.length < 2) {
      return { kind: 'empty' }
    }
    const minV = Math.min(...series.map((p) => p.value))
    const maxV = Math.max(...series.map((p) => p.value))
    const pad = (maxV - minV) * 0.15 || 1
    const lo = minV - pad
    const hi = maxV + pad
    const xn = (i: number) => (i / (series.length - 1)) * 500
    const yv = (v: number) => 100 - ((v - lo) / (hi - lo)) * 100
    const line = series
      .map(
        (p, i) => `${i === 0 ? 'M' : 'L'}${xn(i).toFixed(1)},${yv(p.value).toFixed(1)}`,
      )
      .join(' ')
    return {
      kind: 'ok',
      fillD: line + ' L 500,120 L 0,120 Z',
      lineD: line,
    }
  }, [series])
  if (path.kind === 'empty') return null
  return (
    <svg viewBox="0 0 500 120" className="chart__svg" preserveAspectRatio="none">
      <path d={path.fillD} className="chart__fill" />
      <path d={path.lineD} className="chart__line" fill="none" />
    </svg>
  )
}

export function Dashboard() {
  const session = loadSession()
  const navigate = useNavigate()
  const [data, setData] = useState<InsightsSummary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    const cur = loadSession()
    if (cur == null || cur.onboardingStep !== 'complete') return
    void (async () => {
      try {
        setLoadError(null)
        setData(await api.getInsightsSummary(cur.token))
      } catch (e) {
        setLoadError(
          e instanceof Error ? e.message : 'Could not load the summary.',
        )
      }
    })()
  }, [])

  if (session == null) return <Navigate to="/signup" replace />
  if (session.onboardingStep !== 'complete') {
    return <Navigate to={nextOnboardingPath(session)} replace />
  }

  const reason =
    session.primaryReasonId != null
      ? PRIMARY_REASONS.find((r) => r.id === session.primaryReasonId)
      : null

  const showSample = !session.accountsLinked

  return (
    <div className="dashboard">
      <div className="dashboard__head">
        <h1 className="flow__title" style={{ marginBottom: 0 }}>
          Your directional snapshot
        </h1>
        {reason != null ? (
          <p className="text-muted" style={{ margin: '0.5rem 0 0' }}>
            Personalized for: <strong>{reason.title}</strong>
          </p>
        ) : null}
      </div>

      {showSample ? (
        <p className="banner" role="status">
          <strong>Sample data.</strong> This preview is mock data so you can
          see how we summarize direction, not every transaction. You can
          <button
            type="button"
            className="banner__link"
            onClick={() => {
              updateSession({ onboardingStep: 'connect' })
              void navigate('/onboarding/connect', { replace: true })
            }}
          >
            try the link step again
          </button>{' '}
          in this demo.
        </p>
      ) : (
        <p className="banner banner--muted" role="status">
          <strong>Preview (mock).</strong> The link step was completed in this
          demo; you still see sample insights in this build.
        </p>
      )}

      {loadError != null ? (
        <p className="form__error" role="alert">
          {loadError}
        </p>
      ) : null}

      {data != null ? (
        <>
          <div className="kpi">
            <div>
              <div className="kpi__label">Estimated net worth</div>
              <div className="kpi__value">
                {fmtCurrency(data.netWorth)}
                <span className="kpi__delta">
                  {data.netWorthChange12mPct >= 0 ? '+' : ''}
                  {data.netWorthChange12mPct.toFixed(1)}% 12m
                </span>
              </div>
            </div>
            <p className="kpi__headline text-muted">{data.headline}</p>
          </div>
          <div className="cards">
            {data.focusAreas.map((a) => (
              <div key={a.title} className="card">
                <h2 className="card__t">{a.title}</h2>
                <p className="card__b text-muted">{a.body}</p>
              </div>
            ))}
          </div>
          <div className="chart-block">
            <h2 className="flow__sub">Net worth (trend, mock series)</h2>
            <div
              className="chart"
              aria-label="Simplified 12 month net worth line"
            >
              <TrendChart series={data.netWorthSeries} />
            </div>
          </div>
        </>
      ) : loadError == null ? (
        <p className="text-muted">Loading summary…</p>
      ) : null}
    </div>
  )
}
