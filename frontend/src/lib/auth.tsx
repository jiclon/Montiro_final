import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AuthError, TOKEN_KEY } from './admin'

/**
 * The admin session: one token, kept in `localStorage` so a reload does not
 * throw the owner back to the login screen. Every call that comes back 401 or
 * 403 raises `AuthError`, and `guard` turns that into a clean logout.
 */
type AuthValue = {
  token: string | null
  signedIn: boolean
  signIn: (token: string) => void
  signOut: () => void
  /** Runs a call and signs out if the server says the token is no longer good. */
  guard: <T>(run: (token: string) => Promise<T>) => Promise<T>
}

const AuthContext = createContext<AuthValue | null>(null)

function read(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(read)

  useEffect(() => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* private window — the session then lasts only this tab */
    }
  }, [token])

  const signIn = useCallback((next: string) => setToken(next), [])
  const signOut = useCallback(() => setToken(null), [])

  const guard = useCallback(
    async <T,>(run: (t: string) => Promise<T>): Promise<T> => {
      if (!token) throw new AuthError()
      try {
        return await run(token)
      } catch (err) {
        if (err instanceof AuthError) setToken(null)
        throw err
      }
    },
    [token],
  )

  const value = useMemo<AuthValue>(
    () => ({ token, signedIn: !!token, signIn, signOut, guard }),
    [token, signIn, signOut, guard],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
