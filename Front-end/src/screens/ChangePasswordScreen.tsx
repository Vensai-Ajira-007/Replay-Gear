import { useState, type FormEvent } from 'react'
import { changePassword } from '../lib/api'

export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const input =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-brand/60'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setDone(false)
    if (next.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    if (next !== confirm) {
      setError('New passwords do not match')
      return
    }
    setBusy(true)
    try {
      await changePassword(current, next)
      setDone(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="animate-fade-up rounded-2xl border border-white/10 bg-panel/60 p-8 shadow-2xl shadow-black/30">
        <h1 className="text-2xl font-bold text-white">Change password</h1>
        <p className="mt-1 text-sm text-white/60">
          Enter your current password and choose a new one.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Current password
            </label>
            <input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">
              New password <span className="text-white/40">(min 6 characters)</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-white/70">
              Confirm new password
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={input}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {done && <p className="text-sm text-mint">Password updated.</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </section>
  )
}
