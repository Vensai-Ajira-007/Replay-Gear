import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../config/routes'

export default function LoginScreen() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.home

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="animate-fade-up rounded-2xl border border-white/10 bg-panel/60 p-8 shadow-2xl shadow-black/30">
        <h1 className="text-2xl font-bold text-white">Log in</h1>
        <p className="mt-1 text-sm text-white/60">Welcome back to ReplayGear.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm text-white/70">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-brand/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-brand/60"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/60">
          No account?{' '}
          <Link to={ROUTES.register} className="text-brand-soft hover:text-white">
            Create one
          </Link>
        </p>
      </div>
    </section>
  )
}
