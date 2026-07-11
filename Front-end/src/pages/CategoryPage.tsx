import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FilterBar, { type SortKey } from '../components/FilterBar'
import ProductGrid from '../components/ProductGrid'
import { type Product, type ProductType } from '../data/products'
import { fetchProducts } from '../lib/api'
import { useCart } from '../context/CartContext'

interface CategoryPageProps {
  type: ProductType
  /** Search term, driven by the navbar search box in the layout. */
  search: string
}

const meta: Record<ProductType, { title: string; blurb: string; emoji: string }> = {
  game: {
    title: 'Games',
    blurb: 'Pre-owned titles across PlayStation, Xbox, Nintendo & PC.',
    emoji: '🎮',
  },
  console: {
    title: 'Consoles',
    blurb: 'Tested, cleaned consoles ready to plug in and play.',
    emoji: '🕹️',
  },
}

export default function CategoryPage({ type, search }: CategoryPageProps) {
  const { add } = useCart()

  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [platformFilter, setPlatformFilter] = useState('All')
  const [sort, setSort] = useState<SortKey>('featured')

  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Reset filters when switching between /games and /consoles.
  useEffect(() => {
    setPlatformFilter('All')
    setSort('featured')
  }, [type])

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Re-query the backend whenever the category or a filter changes.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchProducts({ search: debouncedSearch, type, platform: platformFilter, sort })
      .then((products) => {
        if (!cancelled) setItems(products)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong')
          setItems([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSearch, type, platformFilter, sort])

  const handleAddToCart = async (product: Product) => {
    try {
      await add(product.id)
    } catch {
      // Non-fatal for the demo; a real app would surface a toast here.
    }
  }

  const { title, blurb, emoji } = meta[type]

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-sm text-white/50">
        <Link to="/" className="transition hover:text-white">
          Dashboard
        </Link>
        <span className="px-2">/</span>
        <span className="text-white/80">{title}</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-soft text-2xl shadow-lg shadow-brand/30">
          {emoji}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-sm text-white/60">{blurb}</p>
        </div>
      </div>

      <FilterBar
        platformFilter={platformFilter}
        onPlatformChange={setPlatformFilter}
        sort={sort}
        onSortChange={setSort}
        resultCount={items.length}
      />

      <div className="pt-6">
        <ProductGrid
          products={items}
          onAddToCart={handleAddToCart}
          loading={loading}
          error={error}
        />
      </div>
    </section>
  )
}
