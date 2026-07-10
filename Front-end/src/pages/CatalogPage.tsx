import { useEffect, useState } from 'react'
import Hero from '../components/Hero'
import FilterBar, { type SortKey, type TypeFilter } from '../components/FilterBar'
import ProductGrid from '../components/ProductGrid'
import { type Product } from '../data/products'
import { fetchProducts } from '../lib/api'
import { useCart } from '../context/CartContext'

interface CatalogPageProps {
  /** Search term, driven by the navbar search box in the layout. */
  search: string
}

export default function CatalogPage({ search }: CatalogPageProps) {
  const { add } = useCart()

  const [debouncedSearch, setDebouncedSearch] = useState(search)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [sort, setSort] = useState<SortKey>('featured')

  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // Re-query the backend whenever a filter changes.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchProducts({
      search: debouncedSearch,
      type: typeFilter,
      platform: platformFilter,
      sort,
    })
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
  }, [debouncedSearch, typeFilter, platformFilter, sort])

  const handleAddToCart = async (product: Product) => {
    try {
      await add(product.id)
    } catch {
      // Non-fatal for the demo; a real app would surface a toast here.
    }
  }

  return (
    <>
      <Hero />
      <section id="catalog" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Browse the catalog</h2>
          <p className="mt-1 text-sm text-white/60">
            Hand-tested pre-owned games & consoles, ready to play.
          </p>
        </div>

        <FilterBar
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
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
    </>
  )
}
