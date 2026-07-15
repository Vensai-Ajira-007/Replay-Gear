import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../config/routes'

// Go back one screen; if there's no history to pop (deep link / first page),
// fall back to the dashboard so it never leaves the app.
export default function BackButton() {
  const navigate = useNavigate()

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(ROUTES.home)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-1.5 text-sm text-white/60 transition hover:text-white"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Back
    </button>
  )
}
