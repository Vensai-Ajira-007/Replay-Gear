import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import heroBg from '../assets/tufkigckuj241.jpg'
import type { Product } from '../data/products'
import { useCart } from '../context/CartContext'
import { formatINR } from '../lib/format'
import { ROUTES } from '../config/routes'
import ProductCover from './ProductCover'

const SLIDE_MS = 5000

const stats = [
  { value: '500+', label: 'Titles in stock' },
  { value: '30-day', label: 'Money-back guarantee' },
  { value: 'Tested', label: 'Every unit checked' },
]

function discountOf(p: Product): number {
  if (!(p.originalPrice > p.price)) return 0
  return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
}

interface HeroSliderProps {
  products: Product[]
}

/**
 * Rotating full-width banner for the deepest-discounted products, in place of
 * the old static hero.
 */
export default function HeroSlider({ products }: HeroSliderProps) {
  const { add } = useCart()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [adding, setAdding] = useState(false)

  // Read once. The prefers-reduced-motion block in index.css is CSS-only and
  // can't stop a JS timer, so autoplay has to opt out here instead.
  const [reduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const count = products.length

  // Re-armed per slide and cleared on unmount, so StrictMode's double-invoke in
  // dev doesn't leave a second timer running.
  useEffect(() => {
    if (reduceMotion || paused || count < 2) return
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS)
    return () => clearTimeout(t)
  }, [index, paused, reduceMotion, count])

  if (count === 0) return null

  // Modulo at render: the catalogue can shrink under a stale index.
  const current = index % count
  const product = products[current]
  const discount = discountOf(product)

  const onAdd = async () => {
    setAdding(true)
    try {
      await add(product.id)
    } finally {
      setAdding(false)
    }
  }

  const arrow =
    'absolute top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/15 bg-black/40 px-3 py-4 text-xl text-white/70 backdrop-blur transition hover:bg-black/60 hover:text-white sm:block'

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured deals"
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* The store's poster art (from the old hero), fixed behind every slide.
          Deliberately not keyed to the product: it stays put while slides
          change, so the backdrop doesn't flash on each rotation. */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})`, backgroundPosition: 'center right' }}
      />

      {/* Same scrims as the old hero, so the page below still blends in. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div
          key={product.id}
          className="animate-fade grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]"
        >
          {/* Text + actions */}
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              {discount > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-soft">
                  🔥 {discount}% OFF
                </span>
              )}
              <span className="text-xs uppercase tracking-wide text-white/40">
                {product.type}
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              {product.title}
            </h1>

            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/60">
              <span>{product.platform}</span>
              <span aria-hidden="true">·</span>
              <span>{product.condition} condition</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <span className="text-fair">★</span>
                {product.rating.toFixed(1)}
              </span>
            </p>

            <div className="mt-5 flex items-end gap-3">
              <span className="text-3xl font-extrabold text-white">
                {formatINR(product.price)}
              </span>
              {discount > 0 && (
                <span className="pb-1 text-sm text-white/40 line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onAdd}
                disabled={adding}
                className="rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-brand/50 active:scale-95 disabled:opacity-60"
              >
                {adding ? 'Adding…' : 'Add to cart'}
              </button>
              <Link
                to={ROUTES.product(product.id)}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10 active:scale-95"
              >
                View details
              </Link>
            </div>
          </div>

          {/* The cover, whole and framed. */}
          <Link
            to={ROUTES.product(product.id)}
            aria-label={`View ${product.title}`}
            className="hidden lg:block"
            tabIndex={-1}
          >
            <ProductCover
              product={product}
              // Centred so the emoji fallback sits in the middle of the tile,
              // as it does on the product cards.
              className="flex aspect-[3/4] w-56 items-center justify-center rounded-2xl border border-white/10 shadow-2xl shadow-black/50 transition duration-300 hover:scale-[1.02]"
              emojiClassName="text-7xl"
              imgClassName="p-2"
            />
          </Link>
        </div>

        {/* Trust signals, carried over from the hero this replaces. */}
        <dl className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-white/10 pt-5 text-sm">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <dt className="font-bold text-white">{s.value}</dt>
              <dd className="text-white/50">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            aria-label="Previous deal"
            className={`${arrow} left-3`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % count)}
            aria-label="Next deal"
            className={`${arrow} right-3`}
          >
            ›
          </button>

          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2">
            {products.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show deal ${i + 1} of ${count}`}
                aria-current={i === current}
                className={`h-1.5 rounded-full transition-all ${
                  i === current
                    ? 'w-8 bg-brand'
                    : 'w-4 bg-white/25 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
