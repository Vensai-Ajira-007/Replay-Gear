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
import heroBg from '../assets/tufkigckuj241.jpg'
import ProductCover from '../components/ProductCover'
import DeliveryCheck from '../components/DeliveryCheck'
import ConsolePicker from '../components/ConsolePicker'
import ConsoleBadges from '../components/ConsoleBadges'

interface EditForm {
  title: string
  type: ProductType
  platform: string
  consoles: string[]
  condition: Condition
  price: number
  originalPrice: number
  rating: number
  emoji: string
  imageUrl: string
  description: string
  wikipediaUrl: string
  steamAppid: string
  featured: boolean
}

const conditions: Condition[] = ['Mint', 'Good', 'Fair']
const types: ProductType[] = ['game', 'console']

function toForm(p: Product): EditForm {
  return {
    title: p.title,
    type: p.type,
    platform: p.platform,
    consoles: p.consoles ?? [],
    condition: p.condition,
    price: p.price,
    originalPrice: p.originalPrice,
    rating: p.rating,
    emoji: p.emoji,
    imageUrl: p.imageUrl ?? '',
    description: p.description ?? '',
    wikipediaUrl: p.wikipediaUrl ?? '',
    steamAppid: p.steamAppid ? String(p.steamAppid) : '',
    featured: p.featured ?? false,
  }
}

export default function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)

  const { user, isAdmin } = useAuth()
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

  // Only games have a Steam listing, so hardware doesn't get asked for an appid.
  const isConsole = form?.type === 'console'

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
        // Held as a string in the form; blank means "not on Steam".
        steamAppid: Number(form.steamAppid) > 0 ? Number(form.steamAppid) : null,
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
          <div className="shimmer mx-auto aspect-[3/4] w-full max-w-sm rounded-3xl" />
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
        <p className="mt-2 text-white/75">{error ?? 'This item may have been removed.'}</p>
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
    // overflow-hidden is load-bearing: the backdrop is scaled past both edges,
    // and without clipping that becomes a horizontal scrollbar.
    <div className="relative overflow-hidden">
      {/* One shared backdrop for every product, rather than each product's own
          artwork. Because it's a single known image, the dim below is tuned once
          and every product page reads identically — with per-product art, a pale
          cover (Zelda) and a dark one (Elden Ring) needed different settings and
          text legibility varied page to page. Same poster as the home page. */}
      <div
        aria-hidden="true"
        // overflow-hidden here, not just on the wrapper: the scale pushes the
        // image past this layer, and the dim below is inset-0 of it — so an
        // unclipped overflow shows as a bright undimmed strip.
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <img
          src={heroBg}
          alt=""
          className="h-full w-full scale-105 object-cover blur-lg"
        />
        <div className="absolute inset-0 bg-ink/80" />
        {/* Soft hand-off into the footer below. */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <section className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm text-white/70">
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
          <span className="text-white/90">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="animate-fade-up">
            <ProductCover
              product={product}
              className="mx-auto flex aspect-[3/4] w-full max-w-sm items-center justify-center rounded-3xl border border-white/10"
              emojiClassName="text-8xl"
              imgClassName="p-6"
            >
              {discount > 0 && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white shadow-lg ring-1 ring-white/10 backdrop-blur">
                  -{discount}%
                </span>
              )}
              <ConsoleBadges consoles={product.consoles} size="md" />
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
                  <span className="text-xs uppercase tracking-wide text-white/60">
                    {product.type}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/75">
                    <span className="text-fair">★</span>
                    {product.rating.toFixed(1)}
                  </span>
                </div>

                <h1 className="mt-3 text-3xl font-bold text-white">{product.title}</h1>
                <p className="mt-2 text-sm text-white/75">
                  Platform: <span className="text-white/90">{product.platform}</span>
                </p>
                {product.consoles?.length ? (
                  <p className="mt-1 text-sm text-white/75">
                    Consoles:{' '}
                    <span className="text-white/90">{product.consoles.join(', ')}</span>
                  </p>
                ) : null}

                <div className="mt-6 flex items-end gap-3">
                  <span className="text-3xl font-extrabold text-white">
                    {formatINR(product.price)}
                  </span>
                  {product.originalPrice > product.price && (
                    <span className="pb-1 text-sm text-white/60 line-through">
                      {formatINR(product.originalPrice)}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="pb-1 text-sm font-semibold text-mint">
                      Save {discount}%
                    </span>
                  )}
                </div>

                {product.priceSource === 'steam' && (
                  <p className="mt-1.5 text-xs text-white/60">
                    Live Steam price (India)
                  </p>
                )}

                {/* Blurb + source link. Absent on admin-added products, so both
                    the text and the link are rendered only when present. */}
                {product.description && (
                  <p className="mt-5 text-sm leading-relaxed text-white/90">
                    {product.description}
                  </p>
                )}
                {product.wikipediaUrl && (
                  <p className="mt-2 text-xs text-white/60">
                    <a
                      href={product.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-soft transition hover:text-white"
                    >
                      Read more on Wikipedia ↗
                    </a>
                    {product.description && ' — text from Wikipedia, CC BY-SA'}
                  </p>
                )}

                <p className="mt-4 text-sm leading-relaxed text-white/75">
                  A pre-owned {product.type === 'game' ? 'game' : 'console'} in{' '}
                  <span className="text-white/90">{product.condition}</span> condition,
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

                <DeliveryCheck
                  className="mt-6"
                  initialPincode={user?.defaultAddress?.pincode}
                />

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
                  <span className="text-xs text-white/60">id {product.id}</span>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/85">Title</label>
                  <input
                    className={input}
                    required
                    value={form?.title ?? ''}
                    onChange={(e) => set('title', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-white/85">Type</label>
                    <select
                      className={input}
                      value={form?.type}
                      onChange={(e) => {
                        const type = e.target.value as ProductType
                        setForm((f) =>
                          f
                            ? {
                                ...f,
                                type,
                                steamAppid: type === 'console' ? '' : f.steamAppid,
                                consoles: type === 'console' ? [] : f.consoles,
                              }
                            : f,
                        )
                      }}
                    >
                      {types.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-white/85">Platform</label>
                    <select
                      className={input}
                      value={form?.platform}
                      onChange={(e) =>
                        // Consoles are family-scoped, so a new family invalidates them.
                        setForm((f) =>
                          f ? { ...f, platform: e.target.value, consoles: [] } : f,
                        )
                      }
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

                {!isConsole && form && (
                  <ConsolePicker
                    platform={form.platform}
                    value={form.consoles}
                    onChange={(consoles) => set('consoles', consoles)}
                    labelClassName="text-white/85"
                  />
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-white/85">Condition</label>
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
                    <label className="mb-1 block text-sm text-white/85">Price</label>
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
                    <label className="mb-1 block text-sm text-white/85">Was</label>
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
                    <label className="mb-1 block text-sm text-white/85">Rating</label>
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
                    <label className="mb-1 block text-sm text-white/85">Emoji</label>
                    <input
                      className={input}
                      value={form?.emoji ?? ''}
                      onChange={(e) => set('emoji', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-sm text-white/85">
                      Image URL <span className="text-white/60">(optional)</span>
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

                <div>
                  <label className="mb-1 block text-sm text-white/85">
                    Description{' '}
                    <span className="text-white/60">
                      (blank = pull from the Wikipedia article)
                    </span>
                  </label>
                  <textarea
                    className={`${input} min-h-20 resize-y`}
                    rows={3}
                    value={form?.description ?? ''}
                    onChange={(e) => set('description', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className={isConsole ? 'col-span-3' : 'col-span-2'}>
                    <label className="mb-1 block text-sm text-white/85">
                      Wikipedia URL <span className="text-white/60">(optional)</span>
                    </label>
                    <input
                      className={input}
                      type="url"
                      placeholder="https://en.wikipedia.org/wiki/…"
                      value={form?.wikipediaUrl ?? ''}
                      onChange={(e) => set('wikipediaUrl', e.target.value)}
                    />
                  </div>
                  {!isConsole && (
                    <div>
                      <label className="mb-1 block text-sm text-white/85">
                        Steam appid <span className="text-white/60">(optional)</span>
                      </label>
                      <input
                        className={input}
                        type="number"
                        min="1"
                        placeholder="1091500"
                        value={form?.steamAppid ?? ''}
                        onChange={(e) => set('steamAppid', e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-white/85">
                  <input
                    type="checkbox"
                    checked={form?.featured ?? false}
                    onChange={(e) => set('featured', e.target.checked)}
                    className="h-4 w-4 accent-brand"
                  />
                  Feature on the home page
                </label>

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
                    className="rounded-full px-4 py-2.5 text-sm font-medium text-white/75 transition hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
