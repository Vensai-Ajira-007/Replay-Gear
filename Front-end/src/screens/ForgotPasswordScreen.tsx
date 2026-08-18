import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, resetPassword, verifyOtp } from '../lib/api'
import { ROUTES } from '../config/routes'

type Step = 'email' | 'otp' | 'password' | 'done'

export default function ForgotPasswordScreen() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const input =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-brand/60'
  const primary =
    'w-full rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-ink shadow-lg shadow-brand/30 transition hover:opacity-90 disabled:opacity-50'
  const ghost =
    'rounded-full px-4 py-2 text-sm font-medium text-white/70 transition hover:text-white disabled:opacity-50'

  const sendCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      await forgotPassword(email)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code')
    } finally {
      setBusy(false)
    }
  }

  // Resend reuses the same endpoint; the server throttles repeat sends.
  const resend = async () => {
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      await forgotPassword(email)
      setNotice('If a code was due, we sent a new one.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code')
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      setResetToken(await verifyOtp(email, code))
      setStep('password')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify the code')
    } finally {
      setBusy(false)
    }
  }

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('New passwords do not match')
      return
    }
    setBusy(true)
    try {
      await resetPassword(resetToken, password)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password')
    } finally {
      setBusy(false)
    }
  }

  const heading = {
    email: 'Forgot password',
    otp: 'Enter your code',
    password: 'Choose a new password',
    done: 'Password reset',
  }[step]

  const subheading = {
    email: "Enter your email and we'll send you a 6-digit code.",
    otp: `If ${email} is registered, a 6-digit code is on its way.`,
    password: 'Pick something you have not used here before.',
    done: 'You can now log in with your new password.',
  }[step]

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="animate-fade-up rounded-2xl border border-white/10 bg-panel/60 p-8 shadow-2xl shadow-black/30">
        <h1 className="text-2xl font-bold text-white">{heading}</h1>
        <p className="mt-1 text-sm text-white/60">{subheading}</p>

        {step === 'email' && (
          <form className="mt-6 space-y-4" onSubmit={sendCode}>
            <div>
              <label className="mb-1 block text-sm text-white/70">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button type="submit" disabled={busy} className={primary}>
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form className="mt-6 space-y-4" onSubmit={submitCode}>
            <div>
              <label className="mb-1 block text-sm text-white/70">
                6-digit code
              </label>
              <input
                type="text"
                required
                autoFocus
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                // Strip anything non-numeric so a pasted code still validates.
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className={`${input} text-center text-lg tracking-[0.5em]`}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {notice && <p className="text-sm text-mint">{notice}</p>}

            <button type="submit" disabled={busy} className={primary}>
              {busy ? 'Verifying…' : 'Verify code'}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={resend}
                disabled={busy}
                className={ghost}
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setCode('')
                  setError(null)
                  setNotice(null)
                  setStep('email')
                }}
                disabled={busy}
                className={ghost}
              >
                Change email
              </button>
            </div>
          </form>
        )}

        {step === 'password' && (
          <form className="mt-6 space-y-4" onSubmit={submitPassword}>
            <div>
              <label className="mb-1 block text-sm text-white/70">
                New password{' '}
                <span className="text-white/40">(min 6 characters)</span>
              </label>
              <input
                type="password"
                required
                autoFocus
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <button type="submit" disabled={busy} className={primary}>
              {busy ? 'Saving…' : 'Reset password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-mint">
              Password updated. You have been logged out everywhere else.
            </p>
            <button
              type="button"
              onClick={() => navigate(ROUTES.login, { replace: true })}
              className={primary}
            >
              Go to log in
            </button>
          </div>
        )}

        {step !== 'done' && (
          <p className="mt-4 text-center text-sm text-white/60">
            Remembered it?{' '}
            <Link to={ROUTES.login} className="text-brand-soft hover:text-white">
              Log in
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
