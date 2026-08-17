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
import { useToast } from './ToastContext'

const firstName = (name: string) => name.trim().split(' ')[0] || 'there'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  /** Re-read /auth/me — used after saving a default address. */
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

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

  // The toasts fire here rather than in a useEffect on `user` for two reasons:
  // the boot restore above and refreshUser() both change `user` without being
  // an interactive sign-in, and LoginScreen/RegisterScreen navigate away the
  // instant these resolve — so a screen-owned toast would unmount immediately.
  // Triggering in the context also covers both logout buttons (Navbar and
  // ProfileScreen) without touching either.
  const login = async (email: string, password: string) => {
    const { user } = await loginUser({ email, password })
    setUser(user)
    showToast({
      kind: 'success',
      icon: '👋',
      title: `Welcome back, ${firstName(user.name)}`,
      body: "You're logged in.",
    })
  }

  const register = async (name: string, email: string, password: string) => {
    const { user } = await registerUser({ name, email, password })
    setUser(user)
    showToast({
      kind: 'success',
      icon: '🎮',
      title: `Welcome to ReplayGear, ${firstName(user.name)}`,
      body: 'Your account is ready.',
    })
  }

  const logout = async () => {
    await logoutUser()
    setUser(null)
    showToast({
      kind: 'neutral',
      icon: '👋',
      title: 'Signed out',
      body: 'See you next time.',
    })
  }

  const refreshUser = async () => {
    setUser(await fetchMe())
  }

  const value: AuthContextValue = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
