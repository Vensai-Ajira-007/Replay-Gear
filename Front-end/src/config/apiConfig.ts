// Central definition of the API base + endpoint paths.
// - In dev, VITE_API_URL is unset → base is '/api' and Vite proxies to the
//   backend (see vite.config.ts).
// - In production (e.g. Vercel), set VITE_API_URL to the deployed API base,
//   e.g. https://replaygear-api.onrender.com/api
export const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export const API_ENDPOINTS = {
  health: '/health',
  products: '/products',
  product: (id: number | string) => `/products/${id}`,
  cart: '/cart',
  cartItem: (id: number | string) => `/cart/${id}`,
  orders: '/orders',
  order: (id: string) => `/orders/${id}`,
} as const
