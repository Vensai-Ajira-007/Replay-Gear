import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../data/products'
import { formatINR } from '../lib/format'
import { ROUTES } from '../config/routes'
import ProductCover from './ProductCover'

const SLIDE_MS = 6000

/** Rating → the wording a game store uses for its review summary. */
function reviewLabel(rating: number): string {
  if (rating >= 4.5) return 'Overwhelmingly Positive'
  if (rating >= 4) return 'Very Positive'
  if (rating >= 3) return 'Mostly Positive'
  return 'Mixed'
}

function discountOf(p: Product): number {
  if (!(p.originalPrice > p.price)) return 0
  return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
}

/** Green discount chip + price box, the loudest element on the page. */
export function PriceTag({
  product,
  className = '',
}: {
  product: Product
  className?: string
}) {
  const discount = discountOf(product)
  return (
    <div className={`flex items-stretch text-sm ${className}`}>
      {discount > 0 && (
        <span className="grid place-items-center bg-deal-bg px-2 py-1 text-base font-bold text-deal">
          -{discount}%
        </span>
      )}
      <span className="flex items-center gap-2 bg-panel-2/90 px-3 py-1">
        {discount > 0 && (
          <span className="text-xs text-white/40 line-through">
            {formatINR(product.originalPrice)}
          </span>
        )}
        <span className="font-medium text-white">{formatINR(product.price)}</span>
      </span>
    </div>
  )
}

/** One dimmed slide flanking the active one — the store-page peek. */
function Peek({ product }: { product: Product }) {
  return (
    <div
      aria-hidden="true"
      className="hidden w-40 shrink-0 overflow-hidden opacity-40 grayscale xl:block"
    >
      <ProductCover
        product={product}
        fit="cover"
        className="h-full w-full"
        emojiClassName="text-5xl"
      />
    </div>
  )
}

interface FeaturedCarouselProps {
  products: Product[]
}

export default function FeaturedCarousel({ products }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  // Read once: the CSS prefers-reduced-motion block can't stop a JS timer, so
  // auto-rotation has to opt out here instead.
  const [reduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const count = products.length

  // Re-armed per slide; cleared on unmount so StrictMode's double-invoke in dev
  // doesn't leave a second timer running.
  useEffect(() => {
    if (reduceMotion || paused || count < 2) return
    const t = setTimeout(() => setIndex((i) => (i + 1) % count), SLIDE_MS)
    return () => clearTimeout(t)
  }, [index, paused, reduceMotion, count])

  if (count === 0) return null

  // Clamp rather than modulo the render: the catalogue can shrink under us.
  const current = index % count
  const product = products[current]
  const prev = products[(current - 1 + count) % count]
  const next = products[(current + 1) % count]

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count)

  const arrow =
    'absolute top-1/2 z-20 hidden -translate-y-1/2 px-3 py-6 text-3xl text-white/50 transition hover:text-white xl:block'

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="relative flex items-stretch gap-3"
        aria-roledescription="carousel"
        aria-label="Featured and recommended"
      >
        <Peek product={prev} />

        <div className="min-w-0 flex-1">
          <div
            key={product.id}
            className="animate-fade grid overflow-hidden rounded-sm lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          >
            <Link
              to={ROUTES.product(product.id)}
              aria-label={`View ${product.title}`}
              className="block"
            >
              {/* Portrait poster in a 16:9 frame: `cover` would crop it to an
                  unrecognisable detail and `contain` alone leaves dead bars, so
                  the same art is blown up and blurred behind the contained
                  poster to fill the width. */}
              <div className="relative aspect-video w-full overflow-hidden bg-panel-2">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl"
                  />
                )}
                <ProductCover
                  product={product}
                  transparent
                  className="absolute inset-0 h-full w-full"
                  imgClassName="p-4"
                  emojiClassName="text-7xl"
                />
              </div>
            </Link>

            <div className="flex flex-col bg-panel p-5">
              <h3 className="text-xl font-semibold text-white">{product.title}</h3>

              <p className="mt-2 text-sm text-brand">
                {reviewLabel(product.rating)}{' '}
                <span className="text-white/50">
                  ({product.rating.toFixed(1)} / 5)
                </span>
              </p>

              {/* Steam shows a 2x2 screenshot grid here; a product has one image,
                  so show its facts instead of repeating the same picture. */}
              <dl className="mt-5 space-y-2 text-sm">
                {[
                  ['Platform', product.platform],
                  ['Condition', product.condition],
                  ['Type', product.type === 'game' ? 'Game' : 'Console'],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt className="w-20 shrink-0 text-white/40">{label}</dt>
                    <dd className="text-white/80">{value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-5 text-sm font-medium text-positive">
                ↗ Top Seller
                <span className="ml-2 font-normal text-white/70">
                  Ranked #{current + 1} this week
                </span>
              </p>

              <PriceTag product={product} className="mt-auto self-end pt-6" />
            </div>
          </div>
        </div>

        <Peek product={next} />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous item"
              className={`${arrow} left-0`}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next item"
              className={`${arrow} right-0`}
            >
              ›
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show item ${i + 1} of ${count}`}
              aria-current={i === current}
              className={`h-2 w-6 rounded-sm transition ${
                i === current ? 'bg-brand' : 'bg-white/15 hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
