import { useState, type FormEvent } from 'react'
import { checkDelivery, type DeliveryCheck as Result } from '../lib/api'
import { isValidPincode } from '../data/india'
import { formatDeliveryDate } from '../lib/format'

const input =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-brand/60'

interface DeliveryCheckProps {
  className?: string
  /** Prefill, e.g. from the signed-in user's saved address. Never auto-submits. */
  initialPincode?: string
}

/** Area line: metros report a city, everywhere else only the state is known. */
function areaLabel(r: Result): string | null {
  if (r.city && r.state) return `${r.city}, ${r.state}`
  return r.state ?? null
}

export default function DeliveryCheck({
  className = '',
  initialPincode = '',
}: DeliveryCheckProps) {
  const [pincode, setPincode] = useState(initialPincode)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setResult(null)
    // Check the format here so an obviously bad PIN costs no round trip.
    if (!isValidPincode(pincode)) {
      setError('Enter a valid 6-digit PIN code')
      return
    }
    setError(null)
    setBusy(true)
    try {
      setResult(await checkDelivery(pincode))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not check delivery')
    } finally {
      setBusy(false)
    }
  }

  const area = result?.serviceable ? areaLabel(result) : null

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-panel/60 p-4 ${className}`}
    >
      <h2 className="text-sm font-semibold text-white">
        Check delivery availability
      </h2>

      <form className="mt-3 flex items-start gap-2" onSubmit={onSubmit}>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="560001"
          aria-label="PIN code"
          value={pincode}
          // Strip non-digits so a pasted PIN with spaces still validates.
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ''))
            setResult(null)
            setError(null)
          }}
          className={`${input} max-w-36`}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:border-brand/50 hover:bg-white/10 disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Check'}
        </button>
      </form>

      <div role="status" className="mt-3 empty:mt-0">
        {error && <p className="text-sm text-red-400">{error}</p>}

        {result && !result.serviceable && (
          <p className="text-sm text-red-400">
            We don't deliver to this PIN code yet.
          </p>
        )}

        {result?.serviceable && result.etaDate && (
          <>
            <p className="text-sm text-mint">
              Delivery by {formatDeliveryDate(result.etaDate)}
            </p>
            <p className="mt-0.5 text-xs text-white/75">
              {area && <>{area} · </>}
              {result.freeShipping ? 'Free shipping' : 'Shipping charges apply'} ·{' '}
              {result.codAvailable
                ? 'Cash on delivery available'
                : 'Cash on delivery not available'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
