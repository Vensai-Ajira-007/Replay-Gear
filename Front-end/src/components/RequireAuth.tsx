import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../config/routes'

interface RequireAuthProps {
  children: ReactElement
  /** If set, also require this role (e.g. 'admin'). */
  role?: 'admin'
}

// Route guard: redirects to /login if not authenticated, or home if the role
// requirement isn't met.
export default function RequireAuth({ children, role }: RequireAuthProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="p-16 text-center text-white/50">Loading…</div>
  }
  if (!user) {
    return (
      <Navigate to={ROUTES.login} state={{ from: location.pathname }} replace />
    )
  }
  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to={ROUTES.home} replace />
  }
  return children
}
