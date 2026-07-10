import { products, type Product, type ProductType } from '../data/products.js'

export type SortKey = 'featured' | 'price-asc' | 'price-desc'
export type TypeFilter = 'all' | ProductType

export interface CatalogQuery {
  search?: string
  type?: TypeFilter
  platform?: string
  sort?: SortKey
}

/**
 * Filter + sort the catalog. Mirrors the logic the frontend used to run
 * client-side, now owned by the API.
 */
export function queryProducts(query: CatalogQuery): Product[] {
  const search = (query.search ?? '').trim().toLowerCase()
  const type = query.type ?? 'all'
  const platform = query.platform ?? 'All'
  const sort = query.sort ?? 'featured'

  const filtered = products.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.title.toLowerCase().includes(search) ||
      p.platform.toLowerCase().includes(search)
    const matchesType = type === 'all' || p.type === type
    const matchesPlatform = platform === 'All' || p.platform === platform
    return matchesSearch && matchesType && matchesPlatform
  })

  const sorted = [...filtered]
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
  return sorted
}
