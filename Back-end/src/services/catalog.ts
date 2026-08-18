import { BadRequestError } from 'routing-controllers'
import { AppDataSource } from '../db/data-source.js'
import {
  Product,
  type Condition,
  type ProductType,
} from '../entities/Product.js'
import { getSteamPrices } from './steamPrices.js'
import { fetchWikipediaSummary } from './wikipedia.js'

export type SortKey = 'featured' | 'price-asc' | 'price-desc'
export type TypeFilter = 'all' | ProductType

export interface CatalogQuery {
  search?: string
  type?: TypeFilter
  platform?: string
  sort?: SortKey
  /** When true, return only admin-featured products. */
  featured?: boolean
}

function repo() {
  return AppDataSource.getRepository(Product)
}

/**
 * Overlay live Steam prices onto products that have an appid, leaving the rest on
 * their stored prices. Mutates and returns the same instances.
 *
 * Steam's `initial` maps onto originalPrice and `final` onto price, so the
 * frontend's existing strikethrough and "Save X%" badge reflect Steam's real sale
 * with no changes on that side.
 *
 * This lives in the catalog service rather than the controller on purpose: the
 * cart and order services read through getProductById, so the price a customer is
 * charged always matches the price they were shown.
 */
async function applySteamPrices(products: Product[]): Promise<Product[]> {
  const appids = products
    .map((p) => p.steamAppid)
    .filter((id): id is number => typeof id === 'number' && id > 0)

  const prices = appids.length ? await getSteamPrices(appids) : new Map()

  for (const product of products) {
    const live = product.steamAppid ? prices.get(product.steamAppid) : undefined
    if (live) {
      product.price = live.final
      product.originalPrice = live.initial
      product.priceSource = 'steam'
    } else {
      product.priceSource = 'store'
    }
  }
  return products
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
  if (query.featured) {
    qb.andWhere('p.featured = true')
  }

  if (sort === 'price-asc') qb.orderBy('p.price', 'ASC')
  else if (sort === 'price-desc') qb.orderBy('p.price', 'DESC')
  else qb.orderBy('p.id', 'ASC')

  const products = await applySteamPrices(await qb.getMany())

  // The ORDER BY above ran against the stored prices, which the Steam overlay may
  // have just changed — re-sort so the order matches the prices we're returning.
  if (sort === 'price-asc') products.sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') products.sort((a, b) => b.price - a.price)

  return products
}

export async function getProductById(id: number): Promise<Product | null> {
  const product = await repo().findOneBy({ id })
  if (!product) return null
  const [enriched] = await applySteamPrices([product])
  return enriched
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
  description?: string
  wikipediaUrl?: string
  steamAppid?: number | null
  featured?: boolean
}

const TYPES: ProductType[] = ['game', 'console']
const CONDITIONS: Condition[] = ['Mint', 'Good', 'Fair']

/**
 * The blurb to store: whatever the admin typed, or — when they left it blank
 * and gave a Wikipedia link — the article's opening sentences.
 *
 * A blank description with a link set is treated as "pull it from the article",
 * which is the whole point of the field. The fetch never throws, so a Wikipedia
 * outage just leaves the blurb empty instead of failing the save.
 */
async function resolveDescription(
  description: string | null,
  wikipediaUrl: string | null,
): Promise<string | null> {
  if (description || !wikipediaUrl) return description
  const summary = await fetchWikipediaSummary(wikipediaUrl)
  if (summary) {
    console.log(`📖 description pulled from Wikipedia → ${wikipediaUrl}`)
  } else {
    console.warn(`📖 no Wikipedia summary for ${wikipediaUrl}`)
  }
  return summary
}

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

  const wikipediaUrl = input.wikipediaUrl?.trim() || null
  const description = await resolveDescription(
    input.description?.trim() || null,
    wikipediaUrl,
  )

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
    description,
    wikipediaUrl,
    steamAppid: Number(input.steamAppid) > 0 ? Number(input.steamAppid) : null,
    featured: Boolean(input.featured),
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
  description?: string
  wikipediaUrl?: string
  steamAppid?: number | null
  featured?: boolean
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
  if (patch.description !== undefined) {
    existing.description = patch.description.trim() || null
  }
  if (patch.wikipediaUrl !== undefined) {
    existing.wikipediaUrl = patch.wikipediaUrl.trim() || null
  }
  // Only when this edit actually touched one of the two — otherwise every
  // unrelated patch (a price change, say) would re-hit Wikipedia.
  if (patch.description !== undefined || patch.wikipediaUrl !== undefined) {
    existing.description = await resolveDescription(
      existing.description,
      existing.wikipediaUrl,
    )
  }
  if (patch.steamAppid !== undefined) {
    existing.steamAppid = Number(patch.steamAppid) > 0 ? Number(patch.steamAppid) : null
  }
  if (patch.featured !== undefined) existing.featured = Boolean(patch.featured)

  return repo().save(existing)
}

// Admin-only: remove a product. Returns false if it didn't exist.
export async function deleteProduct(id: number): Promise<boolean> {
  const result = await repo().delete({ id })
  return (result.affected ?? 0) > 0
}
