import { Link } from 'react-router-dom'
import { conditionColor, type Product } from '../data/products'
import { useCart } from '../context/CartContext'
import { formatINR } from '../lib/format'
import { ROUTES } from '../config/routes'
import ProductCover from './ProductCover'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cart, add, setQty } = useCart()
  const qty = cart.lines.find((l) => l.product.id === product.id)?.qty ?? 0

  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100,
  )

  // Cart buttons sit above the whole-card link — stop the click from navigating.
  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <article className="card-glow animate-fade-up group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/60 hover:-translate-y-1 hover:border-brand/40">
      {/* Whole-card link to the details screen (stretched-link pattern). */}
      <Link
        to={ROUTES.product(product.id)}
        aria-label={`View ${product.title}`}
        className="absolute inset-0 z-10"
      />
      {/* Cover tile */}
      <ProductCover
        product={product}
        className="flex aspect-[4/3] items-center justify-center"
        emojiClassName="text-6xl transition duration-300 group-hover:scale-110 group-hover:-rotate-3"
        imgClassName="transition duration-500 group-hover:scale-105"
      >
        {/* Diagonal sheen sweep on hover */}
        <div className="pointer-events-none absolute inset-0 z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white shadow-lg ring-1 ring-white/10 backdrop-blur">
            -{discount}%
          </span>
        )}
        <span className="absolute right-3 top-3 z-10 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white/90 ring-1 ring-white/10 backdrop-blur">
          {product.platform}
        </span>
      </ProductCover>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${conditionColor[product.condition]}`}
          >
            {product.condition}
          </span>
          <span className="flex items-center gap-1 text-xs text-white/60">
            <span className="text-fair">★</span>
            {product.rating.toFixed(1)}
          </span>
          <span className="ml-auto text-xs uppercase tracking-wide text-white/40">
            {product.type}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-white">
          {product.title}
        </h3>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <div className="text-lg font-bold text-white">
              {formatINR(product.price)}
            </div>
            <div className="text-xs text-white/40 line-through">
              {formatINR(product.originalPrice)}
            </div>
          </div>
          {qty === 0 ? (
            <button
              type="button"
              onClick={(e) => {
                stop(e)
                add(product.id)
              }}
              className="relative z-20 rounded-full bg-brand/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand active:scale-95"
            >
              Add to cart
            </button>
          ) : (
            <div className="relative z-20 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={(e) => {
                  stop(e)
                  setQty(product.id, qty - 1)
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                aria-label={`Decrease ${product.title}`}
              >
                −
              </button>
              <span className="grid h-8 min-w-8 place-items-center px-1 text-sm font-semibold text-white">
                {qty}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  stop(e)
                  add(product.id)
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-brand/90 text-white transition hover:bg-brand active:scale-95"
                aria-label={`Increase ${product.title}`}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
