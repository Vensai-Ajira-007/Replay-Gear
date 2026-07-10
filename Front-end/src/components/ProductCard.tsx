import { conditionColor, type Product } from '../data/products'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100,
  )

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/60 transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10">
      {/* Cover tile */}
      <div
        className={`relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${product.accent}`}
      >
        <span className="text-6xl drop-shadow-lg transition group-hover:scale-110">
          {product.emoji}
        </span>
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur">
            -{discount}%
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white/90 backdrop-blur">
          {product.platform}
        </span>
      </div>

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
              ${product.price.toFixed(2)}
            </div>
            <div className="text-xs text-white/40 line-through">
              ${product.originalPrice.toFixed(2)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="rounded-full bg-brand/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand active:scale-95"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  )
}
