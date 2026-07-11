import type { Product, ProductType } from '../data/products'
import { API_BASE, API_ENDPOINTS } from '../config/apiConfig'

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

export interface OrderItem {
  id: string
  productId: number
  title: string
  unitPrice: number
  qty: number
  lineTotal: number
}

export interface Order {
  id: string
  createdAt: string
  status: string
  totalItems: number
  subtotal: number
  items: OrderItem[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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
    `${API_ENDPOINTS.products}${qs ? `?${qs}` : ''}`,
  )
  return data.products
}

export async function fetchProduct(id: number): Promise<Product> {
  const data = await request<{ product: Product }>(API_ENDPOINTS.product(id))
  return data.product
}

export async function getCart(): Promise<Cart> {
  const data = await request<{ cart: Cart }>(API_ENDPOINTS.cart)
  return data.cart
}

export async function addToCart(productId: number, qty = 1): Promise<Cart> {
  const data = await request<{ cart: Cart }>(API_ENDPOINTS.cart, {
    method: 'POST',
    body: JSON.stringify({ productId, qty }),
  })
  return data.cart
}

export async function removeFromCart(productId: number): Promise<Cart> {
  const data = await request<{ cart: Cart }>(API_ENDPOINTS.cartItem(productId), {
    method: 'DELETE',
  })
  return data.cart
}

export async function clearCart(): Promise<Cart> {
  const data = await request<{ cart: Cart }>(API_ENDPOINTS.cart, { method: 'DELETE' })
  return data.cart
}

// One-click checkout: turns the current cart into a persisted order and clears
// the cart server-side.
export async function checkout(): Promise<Order> {
  const data = await request<{ order: Order }>(API_ENDPOINTS.orders, { method: 'POST' })
  return data.order
}
