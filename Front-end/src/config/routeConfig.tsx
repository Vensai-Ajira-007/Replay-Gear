import type { RouteObject } from 'react-router-dom'
import DashboardScreen from '../screens/DashboardScreen'
import CategoryScreen from '../screens/CategoryScreen'
import CartScreen from '../screens/CartScreen'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import AdminScreen from '../screens/AdminScreen'
import RequireAuth from '../components/RequireAuth'
import { ROUTES } from './routes'

// Re-export the URL constants so callers can grab both from one place if they
// prefer, though the canonical source is ./routes.
export { ROUTES } from './routes'

// Route table consumed by react-router's useRoutes() in App.tsx.
export const routeConfig: RouteObject[] = [
  { path: ROUTES.home, element: <DashboardScreen /> },
  { path: ROUTES.games, element: <CategoryScreen type="game" /> },
  { path: ROUTES.consoles, element: <CategoryScreen type="console" /> },
  { path: ROUTES.cart, element: <CartScreen /> },
  { path: ROUTES.login, element: <LoginScreen /> },
  { path: ROUTES.register, element: <RegisterScreen /> },
  {
    path: ROUTES.admin,
    element: (
      <RequireAuth role="admin">
        <AdminScreen />
      </RequireAuth>
    ),
  },
]
