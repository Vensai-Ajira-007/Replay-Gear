import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'
import { type Product } from '../data/products'
import { fetchProducts } from '../lib/api'
import { ROUTES } from '../config/routes'

interface Category {
  type: 'game' | 'console'
  to: string
  title: string
  blurb: string
  emoji: string
  accent: string
}

const categories: Category[] = [
  {
    type: 'game',
    to: ROUTES.games,
    title: 'Games',
    blurb: 'Pre-owned titles across PlayStation, Xbox, Nintendo & PC — up to 60% off.',
    emoji: '🎮',
    accent: 'from-brand/30 to-fuchsia-500/20',
  },
  {
    type: 'console',
    to: ROUTES.consoles,
    title: 'Consoles',
    blurb: 'Tested, cleaned consoles ready to plug in and play, with a 30-day guarantee.',
    emoji: '🕹️',
    accent: 'from-blue-500/30 to-cyan-400/20',
  },
]

function discountPct(p: Product): number {
  return p.originalPrice > 0 ? (p.originalPrice - p.price) / p.originalPrice : 0
}

export default function DashboardScreen() {
  const [products, setProducts] = useState<Product[]>([])

  // Fetch the whole catalog once — used for category counts and hot deals.
  useEffect(() => {
    let cancelled = false
    fetchProducts({})
      .then((items) => {
        if (!cancelled) setProducts(items)
      })
      .catch(() => {
        // Leave products empty (cards still render) if the API is unreachable.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = {
    game: products.length ? products.filter((p) => p.type === 'game').length : null,
    console: products.length ? products.filter((p) => p.type === 'console').length : null,
  }

  // Top 4 by discount percentage.
  const deals = useMemo(
    () => [...products].sort((a, b) => discountPct(b) - discountPct(a)).slice(0, 4),
    [products],
  )

  return (
    <>
      <Hero />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Browse by category</h2>
          <p className="mt-1 text-sm text-white/60">
            Pick a shelf to start hunting for your next pickup.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {categories.map((c) => {
            const count = counts[c.type]
            return (
              <Link
                key={c.type}
                to={c.to}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${c.accent} p-8 transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10`}
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-black/30 text-4xl backdrop-blur">
                    {c.emoji}
                  </span>
                  <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
                    {count === null ? '—' : `${count} in stock`}
                  </span>
                </div>

                <h3 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
                  {c.title}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-white/70">{c.blurb}</p>

                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-soft transition group-hover:gap-3">
                  Browse {c.title}
                  <span aria-hidden>→</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {deals.length > 0 && (
        <section id="deals" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">🔥 Hot Deals</h2>
              <p className="mt-1 text-sm text-white/60">
                Biggest markdowns in the store right now.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
