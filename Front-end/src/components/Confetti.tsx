import { useEffect, useMemo, useState } from 'react'

const COLORS = ['#aa3bff', '#c07bff', '#34d399', '#60a5fa', '#fbbf24']
const PIECES = 28
const MAX_LIFETIME_MS = 4200 // longest possible delay + duration, plus slack

/** One-shot celebration burst. Renders nothing once the pieces have fallen. */
export default function Confetti() {
  const [done, setDone] = useState(false)

  // Randomised once on mount — recomputing during render would reshuffle every
  // piece on each re-render and restart the fall.
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        key: i,
        left: `${Math.random() * 100}%`,
        background: COLORS[i % COLORS.length],
        animationDelay: `${Math.random() * 1.2}s`,
        animationDuration: `${2.4 + Math.random() * 1.4}s`,
        // Vary the shape so it doesn't read as a grid of identical bars.
        width: `${6 + Math.round(Math.random() * 5)}px`,
        transform: `rotate(${Math.random() * 360}deg)`,
      })),
    [],
  )

  useEffect(() => {
    const t = setTimeout(() => setDone(true), MAX_LIFETIME_MS)
    return () => clearTimeout(t)
  }, [])

  if (done) return null

  return (
    // pointer-events-none so it never blocks the buttons underneath; z-[55]
    // sits above the page but below the toast (z-[60]).
    <div
      className="pointer-events-none fixed inset-0 z-[55] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map(({ key, ...style }) => (
        <span key={key} className="confetti-piece" style={style} />
      ))}
    </div>
  )
}
