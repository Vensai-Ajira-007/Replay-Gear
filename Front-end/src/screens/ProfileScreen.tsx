import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../config/routes'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  if (!user) return null // RequireAuth guarantees a user, but keeps TS happy.

  const handleLogout = async () => {
    setConfirmLogout(false)
    await logout()
    navigate(ROUTES.home)
  }

  const options = [
    {
      to: ROUTES.profilePassword,
      emoji: '🔑',
      title: 'Change password',
      blurb: 'Update the password you use to sign in.',
    },
    {
      to: ROUTES.profileOrders,
      emoji: '📦',
      title: 'See orders',
      blurb: 'View your past orders and their items.',
    },
  ]

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="animate-fade-up flex items-center gap-4 rounded-2xl border border-white/10 bg-panel/60 p-6">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-soft text-2xl font-bold uppercase text-white shadow-lg shadow-brand/30">
          {user.name.trim().charAt(0) || 'U'}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-white">{user.name}</h1>
          <p className="truncate text-sm text-white/60">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-white/70">
            {user.role}
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {options.map((o, i) => (
          <Link
            key={o.to}
            to={o.to}
            style={{ animationDelay: `${i * 80}ms` }}
            className="card-glow animate-fade-up group flex items-start gap-4 rounded-2xl border border-white/10 bg-panel/60 p-5 transition hover:-translate-y-0.5 hover:border-brand/40"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl transition group-hover:scale-110">
              {o.emoji}
            </span>
            <div>
              <h2 className="font-semibold text-white">{o.title}</h2>
              <p className="mt-0.5 text-sm text-white/55">{o.blurb}</p>
            </div>
            <span className="ml-auto self-center text-white/30 transition group-hover:translate-x-0.5 group-hover:text-brand-soft">
              →
            </span>
          </Link>
        ))}

        {/* Log out */}
        <button
          type="button"
          onClick={() => setConfirmLogout(true)}
          style={{ animationDelay: '160ms' }}
          className="animate-fade-up group flex items-start gap-4 rounded-2xl border border-white/10 bg-panel/60 p-5 text-left transition hover:-translate-y-0.5 hover:border-red-400/40 sm:col-span-2"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-2xl transition group-hover:scale-110">
            🚪
          </span>
          <div>
            <h2 className="font-semibold text-white">Log out</h2>
            <p className="mt-0.5 text-sm text-white/55">Sign out of your account.</p>
          </div>
        </button>
      </div>

      {/* Logout confirmation */}
      {confirmLogout && (
        <div className="animate-fade fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="animate-scale-in w-full max-w-sm rounded-2xl border border-white/10 bg-panel p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold text-white">Log out?</h2>
            <p className="mt-2 text-sm text-white/60">
              Are you sure you want to log out?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-gradient-to-r from-brand to-brand-soft px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
