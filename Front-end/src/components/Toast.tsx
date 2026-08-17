import { useEffect, useState } from 'react'

export type ToastKind = 'success' | 'neutral'

export interface ToastData {
  id: number
  kind: ToastKind
  icon: string
  title: string
  body?: string
}

const VISIBLE_MS = 2500
const LEAVING_MS = 200

export default function Toast({
  toast,
  onDone,
}: {
  toast: ToastData
  onDone: () => void
}) {
  const [leaving, setLeaving] = useState(false)

  // Two-phase dismissal: hold, then play the exit before unmounting. Both
  // timers are cleared on unmount — StrictMode runs this effect twice in dev.
  useEffect(() => {
    const hold = setTimeout(() => setLeaving(true), VISIBLE_MS)
    const remove = setTimeout(onDone, VISIBLE_MS + LEAVING_MS)
    return () => {
      clearTimeout(hold)
      clearTimeout(remove)
    }
  }, [onDone])

  const accent =
    toast.kind === 'success'
      ? 'border-mint/30 text-mint'
      : 'border-white/10 text-brand-soft'

  return (
    // z-[60] clears the navbar (z-30) and the confirm modals (z-50); top-right
    // keeps it clear of AmbientAudio's bottom-right button.
    <div
      role="status"
      className={`fixed right-4 top-20 z-[60] sm:right-6 ${
        leaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <div
        className={`flex max-w-xs items-center gap-3 rounded-2xl border bg-panel px-4 py-3 shadow-2xl shadow-black/40 ${accent}`}
      >
        <span className="animate-pop text-xl" aria-hidden="true">
          {toast.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{toast.title}</p>
          {toast.body && (
            <p className="mt-0.5 truncate text-xs text-white/60">{toast.body}</p>
          )}
        </div>
      </div>
    </div>
  )
}
