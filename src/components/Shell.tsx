import { Link, Outlet, useNavigate } from 'react-router-dom'
import { clearSession, loadSession } from '../lib/session'

const APP = 'Qapital Atlas'

export function Shell() {
  const nav = useNavigate()
  const session = loadSession()
  const homeTo =
    session != null && session.onboardingStep === 'complete'
      ? '/dashboard'
      : '/'

  return (
    <div className="shell">
      <header className="header">
        <div className="header__in">
          <Link to={homeTo} className="logo">
            {APP}
          </Link>
          {session != null && (
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                clearSession()
                void nav('/', { replace: true })
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="main">
        <div className="main__in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
