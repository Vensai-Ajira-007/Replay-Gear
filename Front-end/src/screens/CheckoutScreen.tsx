import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ROUTES } from '../config/routes'
import { formatINR } from '../lib/format'
import AddressForm from '../components/AddressForm'
import Confetti from '../components/Confetti'
import type { DeliveryAddress } from '../lib/api'

export default function CheckoutScreen() {
  const { cart, loading, checkout } = useCart()
  const { user, refreshUser } = useAuth()
  const { showToast } = useToast()
  const [orderId, setOrderId] = useState<string | null>(null)

  const placeOrder = async (address: DeliveryAddress) => {
    const order = await checkout(address)
    // Checkout also saves this as the account's default address — pull it back
    // so a later visit to the profile shows the current value.
    refreshUser().catch(() => {
      // Non-critical: the order succeeded either way.
    })
    setOrderId(order.id)
    showToast({
      kind: 'success',
      icon: '🎉',
      title: 'Order placed!',
      body: `${cart.totalItems} item${cart.totalItems === 1 ? '' : 's'} on the way.`,
    })
  }

  // Order confirmation — the order is now persisted in the database.
  if (orderId) {
    return (
      <section className="animate-fade-up mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <Confetti />
        <div className="animate-pop text-7xl drop-shadow-[0_0_25px_rgba(170,59,255,0.5)]">
          🎉
        </div>
        <h1 className="mt-4 text-3xl font-bold text-white">Order placed!</h1>
        <p className="mt-2 text-white/60">
          Thanks for your purchase. Your games are on the way.
        </p>
        <p className="mt-4 text-xs text-white/40">
          Order ID: <span className="font-mono text-white/60">{orderId}</span>
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to={ROUTES.home}
            className="inline-block rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-brand/50 active:scale-95"
          >
            Keep shopping
          </Link>
          <Link
            to={ROUTES.profileOrders}
            className="rounded-full px-4 py-3 text-sm font-medium text-white/60 transition hover:text-white"
          >
            View orders
          </Link>
        </div>
      </section>
    )
  }

  // Nothing to check out — covers a direct URL visit and a cart emptied elsewhere.
  if (!loading && cart.lines.length === 0) {
    return <Navigate to={ROUTES.cart} replace />
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Delivery details</h1>
          <p className="mt-1 text-sm text-white/60">
            Where should we send your order?
          </p>
        </div>
        <Link
          to={ROUTES.cart}
          className="text-sm text-brand-soft transition hover:text-white"
        >
          ← Back to cart
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Address form */}
        <div className="lg:col-span-2">
          <div className="animate-fade-up rounded-2xl border border-white/10 bg-panel/60 p-6">
            <AddressForm
              // Prefill from the saved default; fall back to the account name.
              initial={user?.defaultAddress ?? { fullName: user?.name ?? '' }}
              submitLabel="Place order"
              busyLabel="Placing order…"
              onSubmit={placeOrder}
            />
            <p className="mt-4 text-xs text-white/40">
              This address is saved to your profile for next time.
            </p>
          </div>
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-panel/60 p-6">
            <h2 className="text-lg font-semibold text-white">Order summary</h2>

            <ul className="mt-4 space-y-2 text-sm">
              {cart.lines.map(({ product, qty, lineTotal }) => (
                <li key={product.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-white/70">
                    {product.title}{' '}
                    <span className="text-white/40">×{qty}</span>
                  </span>
                  <span className="shrink-0 text-white/70">
                    {formatINR(lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between text-white/70">
                <dt>Items ({cart.totalItems})</dt>
                <dd>{formatINR(cart.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-white/70">
                <dt>Shipping</dt>
                <dd className="text-mint">Free</dd>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
                <dt>Total</dt>
                <dd>{formatINR(cart.subtotal)}</dd>
              </div>
            </dl>

            <p className="mt-4 text-center text-xs text-white/40">
              Demo checkout — no payment is taken.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
