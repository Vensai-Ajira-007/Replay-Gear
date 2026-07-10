import type { Product, ProductType } from '../data/products'

// All requests go to relative /api/* — Vite proxies these to the Node
// backend in dev (see vite.config.ts).
const BASE = '/api'

export type SortKey = 'featured' | 'price-asc' | 'price-desc'
export type TypeFilter = 'all' | ProductType

export interface ProductQuery {
  search?: string
  type?: TypeFilter
  platform?: string
  sort?: SortKey
}

export interface CartLine {
  product: Product
  qty: number
  lineTotal: number
}

export interface Cart {
  lines: CartLine[]
  totalItems: number
  subtotal: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export async function fetchProducts(query: ProductQuery): Promise<Product[]> {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.type && query.type !== 'all') params.set('type', query.type)
  if (query.platform && query.platform !== 'All') params.set('platform', query.platform)
  if (query.sort) params.set('sort', query.sort)

  const qs = params.toString()
  const data = await request<{ products: Product[]; count: number }>(
    `/products${qs ? `?${qs}` : ''}`,
  )
  return data.products
}

export async function fetchProduct(id: number): Promise<Product> {
  const data = await request<{ product: Product }>(`/products/${id}`)
  return data.product
}

export async function getCart(): Promise<Cart> {
  const data = await request<{ cart: Cart }>('/cart')
  return data.cart
}

export async function addToCart(productId: number, qty = 1): Promise<Cart> {
  const data = await request<{ cart: Cart }>('/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, qty }),
  })
  return data.cart
}

export async function removeFromCart(productId: number): Promise<Cart> {
  const data = await request<{ cart: Cart }>(`/cart/${productId}`, {
    method: 'DELETE',
  })
  return data.cart
}

export async function clearCart(): Promise<Cart> {
  const data = await request<{ cart: Cart }>('/cart', { method: 'DELETE' })
  return data.cart
}
