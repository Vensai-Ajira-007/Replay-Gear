import { getProductById } from '../services/catalog.js'
import type { Product } from '../entities/Product.js'

// Single global in-memory cart (no auth/sessions in this demo).
// Keyed by productId -> quantity. Resets on server restart.
// Product details for the lines are looked up from Postgres on demand.
const items = new Map<number, number>()

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

export async function getCart(): Promise<CartView> {
  const lines: CartLine[] = []
  for (const [productId, qty] of items) {
    const product = await getProductById(productId)
    if (!product) continue // product no longer exists — skip
    lines.push({ product, qty, lineTotal: round2(product.price * qty) })
  }

  const totalItems = lines.reduce((sum, l) => sum + l.qty, 0)
  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0))
  return { lines, totalItems, subtotal }
}

/** Add `qty` of a product. Returns false if the product id is unknown. */
export async function addItem(productId: number, qty = 1): Promise<boolean> {
  const product = await getProductById(productId)
  if (!product) return false
  const next = (items.get(productId) ?? 0) + Math.max(1, Math.floor(qty))
  items.set(productId, next)
  return true
}

export function removeItem(productId: number): void {
  items.delete(productId)
}

export function clearCart(): void {
  items.clear()
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
