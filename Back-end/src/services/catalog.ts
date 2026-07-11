import { AppDataSource } from '../db/data-source.js'
import { Product, type ProductType } from '../entities/Product.js'

export type SortKey = 'featured' | 'price-asc' | 'price-desc'
export type TypeFilter = 'all' | ProductType

export interface CatalogQuery {
  search?: string
  type?: TypeFilter
  platform?: string
  sort?: SortKey
}

function repo() {
  return AppDataSource.getRepository(Product)
}

/**
 * Filter + sort the catalog from Postgres. Mirrors the previous in-memory
 * behaviour: search over title/platform, filter by type & platform, sort by
 * price (featured = default id order).
 */
export async function queryProducts(query: CatalogQuery): Promise<Product[]> {
  const search = (query.search ?? '').trim()
  const type = query.type ?? 'all'
  const platform = query.platform ?? 'All'
  const sort = query.sort ?? 'featured'

  const qb = repo().createQueryBuilder('p')

  if (type !== 'all') {
    qb.andWhere('p.type = :type', { type })
  }
  if (platform !== 'All') {
    qb.andWhere('p.platform = :platform', { platform })
  }
  if (search !== '') {
    qb.andWhere('(p.title ILIKE :q OR p.platform ILIKE :q)', { q: `%${search}%` })
  }

  if (sort === 'price-asc') qb.orderBy('p.price', 'ASC')
  else if (sort === 'price-desc') qb.orderBy('p.price', 'DESC')
  else qb.orderBy('p.id', 'ASC')

  return qb.getMany()
}

export async function getProductById(id: number): Promise<Product | null> {
  return repo().findOneBy({ id })
}
