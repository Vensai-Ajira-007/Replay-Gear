import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders, type Order } from '../lib/api'
import { formatINR } from '../lib/format'
import { ROUTES } from '../config/routes'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchOrders()
      .then((o) => {
        if (!cancelled) setOrders(o)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load orders')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-white">Your orders</h1>
      <p className="mt-1 text-sm text-white/60">
        {loading ? 'Loading…' : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
      </p>

      {loading && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="shimmer h-32 rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-dashed border-red-400/30 bg-red-500/5 p-6 text-center">
          <p className="font-medium text-white">Couldn’t load your orders</p>
          <p className="mt-1 text-sm text-white/50">{error}</p>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-white/15 py-16 text-center">
          <div className="text-5xl">🛍️</div>
          <p className="mt-3 font-medium text-white">No orders yet</p>
          <p className="mt-1 text-sm text-white/50">
            When you check out, your orders will appear here.
          </p>
          <Link
            to={ROUTES.home}
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90"
          >
            Start shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="animate-fade-up rounded-2xl border border-white/10 bg-panel/60 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <div className="text-xs text-white/40">
                    Order{' '}
                    <span className="font-mono text-white/60">
                      {order.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="text-sm text-white/60">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <span className="rounded-full bg-mint/15 px-2.5 py-1 text-xs font-medium capitalize text-mint ring-1 ring-mint/30">
                  {order.status}
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate text-white/80">
                      {item.title}
                      <span className="text-white/40"> × {item.qty}</span>
                    </span>
                    <span className="shrink-0 text-white/70">
                      {formatINR(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <span className="text-sm text-white/50">
                  {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
                </span>
                <span className="text-base font-bold text-white">
                  {formatINR(order.subtotal)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
