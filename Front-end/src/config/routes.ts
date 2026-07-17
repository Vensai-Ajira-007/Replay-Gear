// Central URL definitions — import these constants for all internal links.
// Kept in a dependency-free leaf module so screens/components can use it
// without creating an import cycle with routeConfig.tsx (which imports screens).
export const ROUTES = {
  home: '/',
  games: '/games',
  consoles: '/consoles',
  cart: '/cart',
  login: '/login',
  register: '/register',
  admin: '/admin',
  // Product details — `productPath` is the route pattern, `product(id)` builds a link.
  productPath: '/product/:id',
  product: (id: number | string) => `/product/${id}`,
  // Account area (all require login).
  profile: '/profile',
  profileOrders: '/profile/orders',
  profilePassword: '/profile/password',
} as const
