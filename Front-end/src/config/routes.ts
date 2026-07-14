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
} as const
