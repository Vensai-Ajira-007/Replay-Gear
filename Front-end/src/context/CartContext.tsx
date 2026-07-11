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
  clearCart,
  getCart,
  removeFromCart,
  type Cart,
  type Order,
} from '../lib/api'

interface CartContextValue {
  cart: Cart
  loading: boolean
  count: number
  add: (productId: number) => Promise<void>
  remove: (productId: number) => Promise<void>
  clear: () => Promise<void>
  checkout: () => Promise<Order>
  refresh: () => Promise<void>
}

const EMPTY_CART: Cart = { lines: [], totalItems: 0, subtotal: 0 }

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setCart(await getCart())
    } catch {
      // Leave the cart empty if the API isn't reachable.
    } finally {
      setLoading(false)
    }
  }, [])

  // Load the server cart once on mount.
  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(async (productId: number) => {
    setCart(await addToCart(productId))
  }, [])

  const remove = useCallback(async (productId: number) => {
    setCart(await removeFromCart(productId))
  }, [])

  const clear = useCallback(async () => {
    setCart(await clearCart())
  }, [])

  // Create a persisted order from the cart; the server clears the cart, so
  // reset the local state to empty afterwards.
  const checkout = useCallback(async () => {
    const order = await checkoutApi()
    setCart(EMPTY_CART)
    return order
  }, [])

  const value: CartContextValue = {
    cart,
    loading,
    count: cart.totalItems,
    add,
    remove,
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
