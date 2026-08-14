import { getProductById } from '../services/catalog.js'
import type { Product } from '../entities/Product.js'
import type { AccessPayload } from '../auth/tokens.js'

// In-memory carts, one per owner key (see cartKey below) -> productId -> quantity.
// Resets on server restart, and guest carts are never evicted, so this map grows
// until then — fine for a demo, but a real deployment wants a TTL or a cart table.
// Product details for the lines are looked up from Postgres on demand.
const carts = new Map<string, Map<number, number>>()

/**
 * Owner key for a cart. Logged-in users get a stable per-account key; guests get
 * one per browser via the `x-cart-id` header the frontend persists in
 * localStorage. `g:anon` is the shared fallback for clients that send neither.
 */
export function cartKey(
  user?: AccessPayload | null,
  headerId?: string,
): string {
  if (user?.sub) return userCartKey(user.sub)
  const id = (headerId ?? '').trim()
  return id ? `g:${id}` : 'g:anon'
}

/** Cart key for a known user id, for callers that only have the id (checkout). */
export function userCartKey(userId: string): string {
  return `u:${userId}`
}

/** The backing map for a key, created on first write. */
function itemsFor(key: string): Map<number, number> {
  let items = carts.get(key)
  if (!items) {
    items = new Map<number, number>()
    carts.set(key, items)
  }
  return items
}

export interface CartLine {
  product: Product
  qty: number
  lineTotal: number
}

export interface CartView {
  lines: CartLine[]
  totalItems: number
  subtotal: number
}

export async function getCart(key: string): Promise<CartView> {
  const lines: CartLine[] = []
  for (const [productId, qty] of carts.get(key) ?? []) {
    const product = await getProductById(productId)
    if (!product) continue // product no longer exists — skip
    lines.push({ product, qty, lineTotal: round2(product.price * qty) })
  }

  const totalItems = lines.reduce((sum, l) => sum + l.qty, 0)
  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0))
  return { lines, totalItems, subtotal }
}

/** Add `qty` of a product. Returns false if the product id is unknown. */
export async function addItem(
  key: string,
  productId: number,
  qty = 1,
): Promise<boolean> {
  const product = await getProductById(productId)
  if (!product) return false
  const items = itemsFor(key)
  const next = (items.get(productId) ?? 0) + Math.max(1, Math.floor(qty))
  items.set(productId, next)
  return true
}

/** Set an absolute quantity. qty <= 0 removes the line. */
export async function setItem(
  key: string,
  productId: number,
  qty: number,
): Promise<void> {
  if (!Number.isFinite(qty) || qty <= 0) {
    carts.get(key)?.delete(productId)
    return
  }
  const product = await getProductById(productId)
  if (!product) return
  itemsFor(key).set(productId, Math.floor(qty))
}

export function removeItem(key: string, productId: number): void {
  carts.get(key)?.delete(productId)
}

export function clearCart(key: string): void {
  carts.delete(key)
}

/**
 * Move a guest cart into a user's cart on login, summing quantities for products
 * already there. Without this, a guest who fills a cart and then logs in would
 * watch it go empty.
 */
export function mergeCarts(fromKey: string, toKey: string): void {
  if (fromKey === toKey) return
  const source = carts.get(fromKey)
  if (!source || source.size === 0) return
  const target = itemsFor(toKey)
  for (const [productId, qty] of source) {
    target.set(productId, (target.get(productId) ?? 0) + qty)
  }
  carts.delete(fromKey)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
