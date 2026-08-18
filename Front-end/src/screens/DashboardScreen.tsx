import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import FeaturedCarousel from '../components/FeaturedCarousel'
import OfferRow from '../components/OfferRow'
import { type Product } from '../data/products'
import { fetchProducts } from '../lib/api'
import { ROUTES } from '../config/routes'

interface Category {
  type: 'game' | 'console'
  to: string
  title: string
  blurb: string
  emoji: string
}

const categories: Category[] = [
  {
    type: 'game',
    to: ROUTES.games,
    title: 'Games',
    blurb: 'Pre-owned titles across PlayStation, Xbox, Nintendo & PC — up to 60% off.',
    emoji: '🎮',
  },
  {
    type: 'console',
    to: ROUTES.consoles,
    title: 'Consoles',
    blurb: 'Tested, cleaned consoles ready to plug in and play, with a 30-day guarantee.',
    emoji: '🕹️',
  },
]

const FEATURED_COUNT = 6
const OFFER_COUNT = 6

function discountPct(p: Product): number {
  return p.originalPrice > 0 ? (p.originalPrice - p.price) / p.originalPrice : 0
}

/** Section heading, matching a store's flat uppercase rules. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-white/10 pb-2 text-sm font-medium uppercase tracking-wider text-white/70">
      {children}
    </h2>
  )
}

export default function DashboardScreen() {
  const [products, setProducts] = useState<Product[]>([])

  // Fetch the whole catalog once — used for category counts, the carousel and offers.
  useEffect(() => {
    let cancelled = false
    fetchProducts({})
      .then((items) => {
        if (!cancelled) setProducts(items)
      })
      .catch(() => {
        // Leave products empty (the page still renders) if the API is unreachable.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = {
    game: products.length ? products.filter((p) => p.type === 'game').length : null,
    console: products.length ? products.filter((p) => p.type === 'console').length : null,
  }

  // Deepest markdowns first: the top few headline the carousel, the next few
  // fill the offers list, so nothing appears twice.
  const byDiscount = useMemo(
    () => [...products].sort((a, b) => discountPct(b) - discountPct(a)),
    [products],
  )
  const featured = byDiscount.slice(0, FEATURED_COUNT)
  const offers = byDiscount.slice(FEATURED_COUNT, FEATURED_COUNT + OFFER_COUNT)

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {featured.length > 0 ? (
        <>
          <h1 className="mb-3 text-xl font-normal text-white/90">
            Featured &amp; Recommended
          </h1>
          <FeaturedCarousel products={featured} />
        </>
      ) : (
        /* Catalogue still loading (or the API is down) — hold the space rather
           than snapping the page taller when it arrives. */
        <div className="shimmer aspect-[21/9] w-full rounded-sm" />
      )}

      {offers.length > 0 && (
        <div id="deals" className="mt-10 scroll-mt-24">
          <SectionHeading>Special Offers</SectionHeading>
          <div className="flex flex-col gap-1">
            {offers.map((product) => (
              <OfferRow key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <SectionHeading>Browse by Category</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((c) => {
            const count = counts[c.type]
            return (
              <Link
                key={c.type}
                to={c.to}
                className="group flex items-center gap-4 border border-white/5 bg-panel/40 p-5 transition hover:border-brand/40 hover:bg-panel"
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-sm bg-panel-2/70 text-3xl">
                  {c.emoji}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-semibold text-white transition group-hover:text-brand">
                      {c.title}
                    </h3>
                    <span className="text-xs text-white/40">
                      {count === null ? '—' : `${count} in stock`}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/60">{c.blurb}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
