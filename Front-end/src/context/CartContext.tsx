import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  addToCart,
  checkout as checkoutApi,
  claimCart,
  clearCart,
  getCart,
  removeFromCart,
  setCartQty,
  type Cart,
  type DeliveryAddress,
  type Order,
} from '../lib/api'
import { useAuth } from './AuthContext'

interface CartContextValue {
  cart: Cart
  loading: boolean
  count: number
  add: (productId: number) => Promise<void>
  remove: (productId: number) => Promise<void>
  setQty: (productId: number, qty: number) => Promise<void>
  clear: () => Promise<void>
  checkout: (deliveryAddress: DeliveryAddress) => Promise<Order>
  refresh: () => Promise<void>
}

const EMPTY_CART: Cart = { lines: [], totalItems: 0, subtotal: 0 }

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART)
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  const refresh = useCallback(async () => {
    try {
      setCart(await getCart())
    } catch {
      // Leave the cart empty if the API isn't reachable.
    } finally {
      setLoading(false)
    }
  }, [])

  // Carts are server-side and keyed by owner, so re-sync whenever the signed-in
  // identity changes. On login we claim the guest cart built before signing in
  // (which returns the merged result); otherwise just read the guest cart.
  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    async function sync() {
      try {
        const next = userId ? await claimCart() : await getCart()
        if (!cancelled) setCart(next)
      } catch {
        // Leave the cart as-is if the API isn't reachable.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    sync()
    return () => {
      cancelled = true
    }
  }, [authLoading, userId])

  const add = useCallback(async (productId: number) => {
    setCart(await addToCart(productId))
  }, [])

  const remove = useCallback(async (productId: number) => {
    setCart(await removeFromCart(productId))
  }, [])

  const setQty = useCallback(async (productId: number, qty: number) => {
    setCart(await setCartQty(productId, qty))
  }, [])

  const clear = useCallback(async () => {
    setCart(await clearCart())
  }, [])

  // Create a persisted order from the cart; the server clears the cart, so
  // reset the local state to empty afterwards.
  const checkout = useCallback(async (deliveryAddress: DeliveryAddress) => {
    const order = await checkoutApi(deliveryAddress)
    setCart(EMPTY_CART)
    return order
  }, [])

  const value: CartContextValue = {
    cart,
    loading,
    count: cart.totalItems,
    add,
    remove,
    setQty,
    clear,
    checkout,
    refresh,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
