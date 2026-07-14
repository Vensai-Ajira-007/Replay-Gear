import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchMe,
  hasSession,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
} from '../lib/api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On load, if we have a stored session, fetch the current user.
  useEffect(() => {
    let cancelled = false
    async function init() {
      if (!hasSession()) {
        setLoading(false)
        return
      }
      try {
        const me = await fetchMe()
        if (!cancelled) setUser(me)
      } catch {
        // token invalid/expired and refresh failed — stay logged out
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { user } = await loginUser({ email, password })
    setUser(user)
  }

  const register = async (name: string, email: string, password: string) => {
    const { user } = await registerUser({ name, email, password })
    setUser(user)
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
  }

  const value: AuthContextValue = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
