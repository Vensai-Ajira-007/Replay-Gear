import { useState, type FormEvent, type ReactNode } from 'react'
import { INDIAN_STATES, isValidPincode } from '../data/india'
import type { DeliveryAddress } from '../lib/api'

const input =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-brand/60'

interface AddressFormProps {
  /** Prefill values (a saved default address, or just the account name). */
  initial?: Partial<DeliveryAddress> | null
  submitLabel: string
  busyLabel: string
  onSubmit: (address: DeliveryAddress) => Promise<void>
  /** Rendered next to the submit button (e.g. a Cancel action). */
  secondaryAction?: ReactNode
}

type Fields = {
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
}

function toFields(initial?: Partial<DeliveryAddress> | null): Fields {
  return {
    fullName: initial?.fullName ?? '',
    phone: initial?.phone ?? '',
    line1: initial?.line1 ?? '',
    line2: initial?.line2 ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    pincode: initial?.pincode ?? '',
  }
}

/**
 * Mirrors normalisePhone in Back-end/src/services/address.ts. The prefix is only
 * stripped when the length confirms it is one, so a valid number that merely
 * starts with 91 (e.g. 9123456780) survives intact.
 */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/[\s\-()]/g, '')
  if (digits.startsWith('+91')) return digits.slice(3)
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

/** Mirrors parseDeliveryAddress on the server so errors show without a round-trip. */
function validate(f: Fields): string | null {
  if (!f.fullName.trim()) return 'Full name is required'
  if (!/^[6-9]\d{9}$/.test(normalisePhone(f.phone))) {
    return 'Enter a valid 10-digit Indian mobile number starting with 6-9'
  }
  if (!f.line1.trim()) return 'Address line 1 is required'
  if (!f.city.trim()) return 'City is required'
  if (!f.state.trim()) return 'State is required'
  if (!isValidPincode(f.pincode.trim())) {
    return 'Enter a valid 6-digit PIN code'
  }
  return null
}

/**
 * The delivery-address fields, shared by the checkout screen and the profile's
 * saved-address editor. The server re-validates everything — this is only to
 * give immediate feedback.
 */
export default function AddressForm({
  initial,
  submitLabel,
  busyLabel,
  onSubmit,
  secondaryAction,
}: AddressFormProps) {
  const [fields, setFields] = useState<Fields>(() => toFields(initial))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) =>
    setFields((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const problem = validate(fields)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setBusy(true)
    try {
      await onSubmit({
        fullName: fields.fullName.trim(),
        phone: normalisePhone(fields.phone),
        line1: fields.line1.trim(),
        line2: fields.line2.trim() || null,
        city: fields.city.trim(),
        state: fields.state,
        pincode: fields.pincode.trim(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-white/70">Full name</label>
          <input
            type="text"
            required
            value={fields.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            className={input}
            placeholder="Who should receive this?"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/70">
            Phone number
          </label>
          <input
            type="tel"
            required
            inputMode="numeric"
            value={fields.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={input}
            placeholder="10-digit mobile"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/70">
          Address line 1
        </label>
        <input
          type="text"
          required
          value={fields.line1}
          onChange={(e) => set('line1', e.target.value)}
          className={input}
          placeholder="House / flat no., building, street"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-white/70">
          Address line 2 <span className="text-white/40">(optional)</span>
        </label>
        <input
          type="text"
          value={fields.line2}
          onChange={(e) => set('line2', e.target.value)}
          className={input}
          placeholder="Area, landmark"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-white/70">City</label>
          <input
            type="text"
            required
            value={fields.city}
            onChange={(e) => set('city', e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/70">State</label>
          <select
            required
            value={fields.state}
            onChange={(e) => set('state', e.target.value)}
            className={input}
          >
            <option value="">Select…</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/70">PIN code</label>
          <input
            type="text"
            required
            inputMode="numeric"
            maxLength={6}
            value={fields.pincode}
            onChange={(e) => set('pincode', e.target.value)}
            className={input}
            placeholder="560001"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-2.5 text-sm font-semibold text-ink shadow-lg shadow-brand/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? busyLabel : submitLabel}
        </button>
        {secondaryAction}
      </div>
    </form>
  )
}
