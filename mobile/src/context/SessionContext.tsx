import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { clearSession, loadSession, type AppSession } from '../lib/session'
import { navigationRef } from '../navigation/navigationRef'

type Ctx = {
  session: AppSession | null
  setSession: (s: AppSession | null) => void
  ready: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<Ctx | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    setSession(await loadSession())
  }, [])

  useEffect(() => {
    void loadSession().then((s) => {
      setSession(s)
      setReady(true)
    })
  }, [])

  const signOut = useCallback(async () => {
    await clearSession()
    setSession(null)
    if (navigationRef.isReady()) {
      navigationRef.reset({ index: 0, routes: [{ name: 'SignUp' }] })
    }
  }, [])

  const v: Ctx = {
    session,
    setSession,
    ready,
    refresh,
    signOut,
  }
  return (
    <SessionContext.Provider value={v}>{children}</SessionContext.Provider>
  )
}

// Hook colocated with provider in this small app.
// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): Ctx {
  const c = useContext(SessionContext)
  if (c == null) {
    throw new Error('useSession must be under SessionProvider')
  }
  return c
}
