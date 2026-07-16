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
  userId?: string | null
  items: OrderItem[]
}

export type Role = 'admin' | 'customer'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface AuthResult {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

// --- Token store (in memory + localStorage) ---------------------------------
const ACCESS_KEY = 'rg_access'
const REFRESH_KEY = 'rg_refresh'

let accessToken: string | null = localStorage.getItem(ACCESS_KEY)
let refreshToken: string | null = localStorage.getItem(REFRESH_KEY)

export function setTokens(access: string, refresh: string): void {
  accessToken = access
  refreshToken = refresh
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  accessToken = null
  refreshToken = null
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function hasSession(): boolean {
  return !!refreshToken
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_BASE}${API_ENDPOINTS.auth.refresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const data = (await res.json()) as AuthResult
    setTokens(data.accessToken, data.refreshToken)
    return true
  } catch {
    return false
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  // Access token expired → refresh once, then retry the original request.
  if (res.status === 401 && retry && refreshToken && !path.startsWith('/auth/')) {
    if (await tryRefresh()) return request<T>(path, init, false)
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      // routing-controllers errors use `message`; ours use `error`.
      if (body?.error) message = body.error
      else if (body?.message) message = body.message
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

// Set an absolute quantity for a line (qty <= 0 removes it).
export async function setCartQty(productId: number, qty: number): Promise<Cart> {
  const data = await request<{ cart: Cart }>(API_ENDPOINTS.cartItem(productId), {
    method: 'PATCH',
    body: JSON.stringify({ qty }),
  })
  return data.cart
}

export async function clearCart(): Promise<Cart> {
  const data = await request<{ cart: Cart }>(API_ENDPOINTS.cart, { method: 'DELETE' })
  return data.cart
}

// One-click checkout: turns the current cart into a persisted order and clears
// the cart server-side. Requires a logged-in user.
export async function checkout(): Promise<Order> {
  const data = await request<{ order: Order }>(API_ENDPOINTS.orders, { method: 'POST' })
  return data.order
}

// --- Auth -------------------------------------------------------------------
export async function registerUser(input: {
  name: string
  email: string
  password: string
}): Promise<AuthResult> {
  const data = await request<AuthResult>(API_ENDPOINTS.auth.register, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  setTokens(data.accessToken, data.refreshToken)
  return data
}

export async function loginUser(input: {
  email: string
  password: string
}): Promise<AuthResult> {
  const data = await request<AuthResult>(API_ENDPOINTS.auth.login, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  setTokens(data.accessToken, data.refreshToken)
  return data
}

export async function logoutUser(): Promise<void> {
  try {
    await request(API_ENDPOINTS.auth.logout, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  } finally {
    clearTokens()
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  const data = await request<{ user: AuthUser | null }>(API_ENDPOINTS.auth.me)
  return data.user
}

// --- Admin: product management ----------------------------------------------
export interface NewProductInput {
  title: string
  type: ProductType
  platform: string
  condition: 'Mint' | 'Good' | 'Fair'
  price: number
  originalPrice: number
  rating?: number
  emoji?: string
  accent?: string
  imageUrl?: string
}

export async function createProduct(input: NewProductInput): Promise<Product> {
  const data = await request<{ product: Product }>(API_ENDPOINTS.products, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.product
}

export async function deleteProduct(id: number): Promise<void> {
  await request(API_ENDPOINTS.product(id), { method: 'DELETE' })
}
