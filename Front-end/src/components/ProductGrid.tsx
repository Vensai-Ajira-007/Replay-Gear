import type { Product } from '../data/products'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  error?: string | null
}

const gridClasses =
  'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

export default function ProductGrid({
  products,
  loading = false,
  error = null,
}: ProductGridProps) {
  if (error) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-red-400/30 bg-red-500/5 py-20 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="mt-3 font-medium text-white">Couldn’t load the catalog</p>
        <p className="mt-1 text-sm text-white/50">{error}</p>
        <p className="mt-1 text-xs text-white/40">
          Is the backend running on port 4000?
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-white/10 bg-panel/60"
          >
            <div className="aspect-[4/3] animate-pulse bg-white/5" />
            <div className="space-y-3 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
              <div className="h-8 w-full animate-pulse rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-white/15 py-20 text-center">
        <div className="text-4xl">🕹️</div>
        <p className="mt-3 font-medium text-white">No matches found</p>
        <p className="mt-1 text-sm text-white/50">
          Try a different search term or clear your filters.
        </p>
      </div>
    )
  }

  return (
    <div className={gridClasses}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
