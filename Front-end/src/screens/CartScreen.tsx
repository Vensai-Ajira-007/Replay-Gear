import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { conditionColor } from '../data/products'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '../config/routes'

export default function CartScreen() {
  const { cart, loading, add, remove, clear, checkout } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    // Must be logged in to check out — send guests to login, then back to cart.
    if (!user) {
      navigate(ROUTES.login, { state: { from: ROUTES.cart } })
      return
    }
    setBusy(true)
    setError(null)
    try {
      const order = await checkout()
      setOrderId(order.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
    } finally {
      setBusy(false)
    }
  }

  // Order confirmation — the order is now persisted in the database.
  if (orderId) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <div className="text-6xl">🎉</div>
        <h1 className="mt-4 text-3xl font-bold text-white">Order placed!</h1>
        <p className="mt-2 text-white/60">
          Thanks for your purchase. Your games are on the way.
        </p>
        <p className="mt-4 text-xs text-white/40">
          Order ID: <span className="font-mono text-white/60">{orderId}</span>
        </p>
        <Link
          to={ROUTES.home}
          className="mt-8 inline-block rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90"
        >
          Keep shopping
        </Link>
      </section>
    )
  }

  // Empty cart.
  if (!loading && cart.lines.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 text-3xl font-bold text-white">Your cart is empty</h1>
        <p className="mt-2 text-white/60">
          Browse the catalog and add some games or consoles to get started.
        </p>
        <Link
          to={ROUTES.home}
          className="mt-8 inline-block rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90"
        >
          Browse the catalog
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your cart</h1>
          <p className="mt-1 text-sm text-white/60">
            {cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Link
          to={ROUTES.home}
          className="text-sm text-brand-soft transition hover:text-white"
        >
          ← Continue shopping
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Line items */}
        <div className="lg:col-span-2">
          <ul className="space-y-4">
            {cart.lines.map(({ product, qty, lineTotal }) => (
              <li
                key={product.id}
                className="flex gap-4 rounded-2xl border border-white/10 bg-panel/60 p-4"
              >
                {/* Cover */}
                <div
                  className={`grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${product.accent}`}
                >
                  <span className="text-3xl drop-shadow">{product.emoji}</span>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start gap-2">
                    <h3 className="font-semibold leading-snug text-white">
                      {product.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => remove(product.id)}
                      className="ml-auto shrink-0 rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-red-400"
                      aria-label={`Remove ${product.title}`}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${conditionColor[product.condition]}`}
                    >
                      {product.condition}
                    </span>
                    <span className="text-xs text-white/50">{product.platform}</span>
                  </div>

                  <div className="mt-auto flex items-end justify-between pt-3">
                    {/* Quantity */}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-1 py-1">
                        <span className="grid h-7 w-8 place-items-center text-sm font-semibold text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => add(product.id)}
                          className="grid h-7 w-7 place-items-center rounded-full bg-brand/90 text-white transition hover:bg-brand"
                          aria-label={`Add one more ${product.title}`}
                        >
                          +
                        </button>
                      </span>
                      <span className="text-xs text-white/40">
                        ${product.price.toFixed(2)} each
                      </span>
                    </div>
                    <div className="text-lg font-bold text-white">
                      ${lineTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => clear()}
            className="mt-4 text-sm text-white/50 transition hover:text-red-400"
          >
            Clear cart
          </button>
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-panel/60 p-6">
            <h2 className="text-lg font-semibold text-white">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-white/70">
                <dt>Items ({cart.totalItems})</dt>
                <dd>${cart.subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between text-white/70">
                <dt>Shipping</dt>
                <dd className="text-mint">Free</dd>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                <dt>Total</dt>
                <dd>${cart.subtotal.toFixed(2)}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={busy || cart.lines.length === 0}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Placing order…' : user ? 'Checkout' : 'Log in to check out'}
            </button>
            {error && (
              <p className="mt-3 text-center text-xs text-red-400">{error}</p>
            )}
            <p className="mt-3 text-center text-xs text-white/40">
              Demo checkout — no payment is taken.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
