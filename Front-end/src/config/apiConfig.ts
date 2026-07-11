// Central definition of the API base + endpoint paths. All requests go to
// relative /api/* — Vite proxies these to the backend in dev (see vite.config.ts).
export const API_BASE = '/api'

export const API_ENDPOINTS = {
  health: '/health',
  products: '/products',
  product: (id: number | string) => `/products/${id}`,
  cart: '/cart',
  cartItem: (id: number | string) => `/cart/${id}`,
  orders: '/orders',
  order: (id: string) => `/orders/${id}`,
} as const
