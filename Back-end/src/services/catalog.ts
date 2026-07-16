import { BadRequestError } from 'routing-controllers'
import { AppDataSource } from '../db/data-source.js'
import {
  Product,
  type Condition,
  type ProductType,
} from '../entities/Product.js'

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

export interface NewProduct {
  title?: string
  type?: ProductType
  platform?: string
  condition?: Condition
  price?: number
  originalPrice?: number
  rating?: number
  emoji?: string
  accent?: string
  imageUrl?: string
}

const TYPES: ProductType[] = ['game', 'console']
const CONDITIONS: Condition[] = ['Mint', 'Good', 'Fair']

// Admin-only: add a new product. Assigns the next id (PK is a fixed int).
export async function createProduct(input: NewProduct): Promise<Product> {
  const title = (input.title ?? '').trim()
  if (!title) throw new BadRequestError('Title is required')
  if (!input.type || !TYPES.includes(input.type)) {
    throw new BadRequestError("type must be 'game' or 'console'")
  }
  if (!input.platform?.trim()) throw new BadRequestError('Platform is required')
  if (!input.condition || !CONDITIONS.includes(input.condition)) {
    throw new BadRequestError('condition must be Mint, Good or Fair')
  }
  const price = Number(input.price)
  const originalPrice = Number(input.originalPrice ?? input.price)
  if (!(price > 0)) throw new BadRequestError('price must be a positive number')

  const max = await repo()
    .createQueryBuilder('p')
    .select('MAX(p.id)', 'max')
    .getRawOne<{ max: number | null }>()
  const nextId = (max?.max ?? 0) + 1

  const product = repo().create({
    id: nextId,
    title,
    type: input.type,
    platform: input.platform.trim(),
    condition: input.condition,
    price,
    originalPrice: originalPrice > 0 ? originalPrice : price,
    rating: Number(input.rating) || 4.5,
    emoji: input.emoji?.trim() || '🎮',
    accent: input.accent?.trim() || 'from-brand/30 to-fuchsia-500/20',
    imageUrl: input.imageUrl?.trim() || null,
  })
  return repo().save(product)
}

export interface UpdateProduct {
  title?: string
  type?: ProductType
  platform?: string
  condition?: Condition
  price?: number
  originalPrice?: number
  rating?: number
  emoji?: string
  accent?: string
  imageUrl?: string
}

// Admin-only: update an existing product. Only the provided fields are changed;
// each is validated the same way as on create. Returns null if id doesn't exist.
export async function updateProduct(
  id: number,
  patch: UpdateProduct,
): Promise<Product | null> {
  const existing = await repo().findOneBy({ id })
  if (!existing) return null

  if (patch.title !== undefined) {
    const title = patch.title.trim()
    if (!title) throw new BadRequestError('Title is required')
    existing.title = title
  }
  if (patch.type !== undefined) {
    if (!TYPES.includes(patch.type)) {
      throw new BadRequestError("type must be 'game' or 'console'")
    }
    existing.type = patch.type
  }
  if (patch.platform !== undefined) {
    if (!patch.platform.trim()) throw new BadRequestError('Platform is required')
    existing.platform = patch.platform.trim()
  }
  if (patch.condition !== undefined) {
    if (!CONDITIONS.includes(patch.condition)) {
      throw new BadRequestError('condition must be Mint, Good or Fair')
    }
    existing.condition = patch.condition
  }
  if (patch.price !== undefined) {
    const price = Number(patch.price)
    if (!(price > 0)) throw new BadRequestError('price must be a positive number')
    existing.price = price
  }
  if (patch.originalPrice !== undefined) {
    const originalPrice = Number(patch.originalPrice)
    if (!(originalPrice > 0)) {
      throw new BadRequestError('originalPrice must be a positive number')
    }
    existing.originalPrice = originalPrice
  }
  if (patch.rating !== undefined) {
    const rating = Number(patch.rating)
    if (!(rating >= 0 && rating <= 5)) {
      throw new BadRequestError('rating must be between 0 and 5')
    }
    existing.rating = rating
  }
  if (patch.emoji !== undefined) existing.emoji = patch.emoji.trim() || '🎮'
  if (patch.accent !== undefined) {
    existing.accent = patch.accent.trim() || 'from-brand/30 to-fuchsia-500/20'
  }
  if (patch.imageUrl !== undefined) existing.imageUrl = patch.imageUrl.trim() || null

  return repo().save(existing)
}

// Admin-only: remove a product. Returns false if it didn't exist.
export async function deleteProduct(id: number): Promise<boolean> {
  const result = await repo().delete({ id })
  return (result.affected ?? 0) > 0
}
