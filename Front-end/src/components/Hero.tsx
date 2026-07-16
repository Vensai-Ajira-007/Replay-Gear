import { Link } from 'react-router-dom'
import heroBg from '../assets/tufkigckuj241.jpg'
import { ROUTES } from '../config/routes'

const stats = [
  { value: '500+', label: 'Titles in stock' },
  { value: '30-day', label: 'Money-back guarantee' },
  { value: 'Tested', label: 'Every unit checked' },
]

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Poster background (art sits on the right) */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})`, backgroundPosition: 'center right' }}
      />
      {/* Darken the left so the headline stays readable; let art show on the right */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
      {/* Blend the hero into the page below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand-soft">
            ♻️ Pre-owned, planet-friendly, budget-friendly
          </span>
          <h1
            className="animate-fade-up mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl"
            style={{ animationDelay: '80ms' }}
          >
            Level up for <span className="text-brand-soft">less.</span>
          </h1>
          <p
            className="animate-fade-up mt-4 max-w-xl text-lg text-white/70"
            style={{ animationDelay: '160ms' }}
          >
            Quality pre-owned games and consoles — inspected, cleaned, and
            guaranteed. Save up to 60% off retail on the titles you love.
          </p>
          <div
            className="animate-fade-up mt-7 flex flex-wrap gap-3"
            style={{ animationDelay: '240ms' }}
          >
            <Link
              to={ROUTES.games}
              className="rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-brand/50 active:scale-95"
            >
              Shop games
            </Link>
            <Link
              to={ROUTES.consoles}
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 active:scale-95"
            >
              Browse consoles
            </Link>
          </div>

          <dl
            className="animate-fade-up mt-10 grid max-w-lg grid-cols-3 gap-4"
            style={{ animationDelay: '320ms' }}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white/10"
              >
                <dt className="text-xl font-bold text-white">{s.value}</dt>
                <dd className="mt-1 text-xs text-white/60">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
