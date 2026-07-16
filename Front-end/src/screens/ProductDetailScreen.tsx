import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  conditionColor,
  platforms,
  type Condition,
  type Product,
  type ProductType,
} from '../data/products'
import { fetchProduct, updateProduct } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatINR } from '../lib/format'
import { ROUTES } from '../config/routes'
import ProductCover from '../components/ProductCover'

interface EditForm {
  title: string
  type: ProductType
  platform: string
  condition: Condition
  price: number
  originalPrice: number
  rating: number
  emoji: string
  imageUrl: string
}

const conditions: Condition[] = ['Mint', 'Good', 'Fair']
const types: ProductType[] = ['game', 'console']

function toForm(p: Product): EditForm {
  return {
    title: p.title,
    type: p.type,
    platform: p.platform,
    condition: p.condition,
    price: p.price,
    originalPrice: p.originalPrice,
    rating: p.rating,
    emoji: p.emoji,
    imageUrl: p.imageUrl ?? '',
  }
}

export default function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)

  const { isAdmin } = useAuth()
  const { cart, add, setQty } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Admin edit state.
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setEditing(false)
    fetchProduct(productId)
      .then((p) => {
        if (!cancelled) setProduct(p)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong')
          setProduct(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  const set = <K extends keyof EditForm>(k: K, v: EditForm[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f))

  const startEdit = () => {
    if (!product) return
    setForm(toForm(product))
    setSaveError(null)
    setSavedMsg(null)
    setEditing(true)
  }

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setSaving(true)
    setSaveError(null)
    setSavedMsg(null)
    try {
      const updated = await updateProduct(productId, {
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || Number(form.price),
        rating: Number(form.rating),
      })
      setProduct(updated)
      setEditing(false)
      setSavedMsg('Changes saved.')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="shimmer aspect-square rounded-2xl" />
          <div className="space-y-4">
            <div className="shimmer h-4 w-1/3 rounded" />
            <div className="shimmer h-8 w-3/4 rounded" />
            <div className="shimmer h-24 w-full rounded" />
          </div>
        </div>
      </section>
    )
  }

  if (error || !product) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <div className="text-6xl">🔍</div>
        <h1 className="mt-4 text-2xl font-bold text-white">Product not found</h1>
        <p className="mt-2 text-white/60">{error ?? 'This item may have been removed.'}</p>
        <Link
          to={ROUTES.home}
          className="mt-8 inline-block rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90"
        >
          Back to store
        </Link>
      </section>
    )
  }

  const qty = cart.lines.find((l) => l.product.id === product.id)?.qty ?? 0
  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100,
  )
  const input =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-brand/60'

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-white/50">
        <Link to={ROUTES.home} className="transition hover:text-white">
          Dashboard
        </Link>
        <span className="px-2">/</span>
        <Link
          to={product.type === 'game' ? ROUTES.games : ROUTES.consoles}
          className="transition hover:text-white"
        >
          {product.type === 'game' ? 'Games' : 'Consoles'}
        </Link>
        <span className="px-2">/</span>
        <span className="text-white/80">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="animate-fade-up">
          <ProductCover
            product={product}
            className="flex aspect-square w-full items-center justify-center rounded-3xl border border-white/10"
            emojiClassName="text-8xl"
          >
            {discount > 0 && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white shadow-lg ring-1 ring-white/10 backdrop-blur">
                -{discount}%
              </span>
            )}
          </ProductCover>
        </div>

        {/* Details / edit */}
        <div className="animate-fade-up">
          {!editing ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${conditionColor[product.condition]}`}
                >
                  {product.condition}
                </span>
                <span className="text-xs uppercase tracking-wide text-white/40">
                  {product.type}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/60">
                  <span className="text-fair">★</span>
                  {product.rating.toFixed(1)}
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-bold text-white">{product.title}</h1>
              <p className="mt-2 text-sm text-white/60">
                Platform: <span className="text-white/80">{product.platform}</span>
              </p>

              <div className="mt-6 flex items-end gap-3">
                <span className="text-3xl font-extrabold text-white">
                  {formatINR(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="pb-1 text-sm text-white/40 line-through">
                    {formatINR(product.originalPrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="pb-1 text-sm font-semibold text-mint">
                    Save {discount}%
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/60">
                A pre-owned {product.type === 'game' ? 'game' : 'console'} in{' '}
                <span className="text-white/80">{product.condition}</span> condition,
                cleaned and tested. Free shipping and a 30-day guarantee.
              </p>

              {/* Add to cart */}
              <div className="mt-8">
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => add(product.id)}
                    className="rounded-full bg-gradient-to-r from-brand to-brand-soft px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-brand/50 active:scale-95"
                  >
                    Add to cart
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5">
                    <button
                      type="button"
                      onClick={() => setQty(product.id, qty - 1)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="grid h-9 min-w-9 place-items-center px-1 text-sm font-semibold text-white">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => add(product.id)}
                      className="grid h-9 w-9 place-items-center rounded-full bg-brand/90 text-white transition hover:bg-brand active:scale-95"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <Link
                      to={ROUTES.cart}
                      className="ml-2 px-3 text-sm font-medium text-brand-soft transition hover:text-white"
                    >
                      View cart →
                    </Link>
                  </div>
                )}
              </div>

              {savedMsg && <p className="mt-4 text-sm text-mint">{savedMsg}</p>}

              {/* Admin actions */}
              {isAdmin && (
                <div className="mt-auto pt-8">
                  <button
                    type="button"
                    onClick={startEdit}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-brand/50 hover:bg-white/10"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    Edit product
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* --- Admin edit form --- */
            <form
              onSubmit={onSave}
              className="space-y-4 rounded-2xl border border-white/10 bg-panel/60 p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Edit product</h2>
                <span className="text-xs text-white/40">id {product.id}</span>
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/70">Title</label>
                <input
                  className={input}
                  required
                  value={form?.title ?? ''}
                  onChange={(e) => set('title', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-white/70">Type</label>
                  <select
                    className={input}
                    value={form?.type}
                    onChange={(e) => set('type', e.target.value as ProductType)}
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Platform</label>
                  <select
                    className={input}
                    value={form?.platform}
                    onChange={(e) => set('platform', e.target.value)}
                  >
                    {platforms
                      .filter((p) => p !== 'All')
                      .map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-white/70">Condition</label>
                  <select
                    className={input}
                    value={form?.condition}
                    onChange={(e) => set('condition', e.target.value as Condition)}
                  >
                    {conditions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Price</label>
                  <input
                    className={input}
                    type="number"
                    step="1"
                    required
                    value={form?.price || ''}
                    onChange={(e) => set('price', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Was</label>
                  <input
                    className={input}
                    type="number"
                    step="1"
                    value={form?.originalPrice || ''}
                    onChange={(e) => set('originalPrice', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-white/70">Rating</label>
                  <input
                    className={input}
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form?.rating ?? ''}
                    onChange={(e) => set('rating', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-white/70">Emoji</label>
                  <input
                    className={input}
                    value={form?.emoji ?? ''}
                    onChange={(e) => set('emoji', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm text-white/70">
                    Image URL <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    className={input}
                    type="url"
                    placeholder="https://…"
                    value={form?.imageUrl ?? ''}
                    onChange={(e) => set('imageUrl', e.target.value)}
                  />
                </div>
              </div>

              {saveError && <p className="text-sm text-red-400">{saveError}</p>}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-white/60 transition hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
