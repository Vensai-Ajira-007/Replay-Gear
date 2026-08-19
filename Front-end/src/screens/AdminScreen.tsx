import { useEffect, useState, type FormEvent } from 'react'
import { platforms, type Condition, type Product, type ProductType } from '../data/products'
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  type NewProductInput,
} from '../lib/api'
import { formatINR } from '../lib/format'
import ProductCover from '../components/ProductCover'
import ConsolePicker from '../components/ConsolePicker'

const emptyForm: NewProductInput = {
  title: '',
  type: 'game',
  platform: 'PlayStation',
  consoles: [],
  condition: 'Good',
  price: 0,
  originalPrice: 0,
  emoji: '🎮',
  imageUrl: '',
  description: '',
  wikipediaUrl: '',
  steamAppid: null,
  featured: false,
}

const conditions: Condition[] = ['Mint', 'Good', 'Fair']
const types: ProductType[] = ['game', 'console']

export default function AdminScreen() {
  const [form, setForm] = useState<NewProductInput>(emptyForm)
  const [products, setProducts] = useState<Product[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () => {
    fetchProducts({}).then(setProducts).catch(() => {})
  }
  useEffect(load, [])

  const set = <K extends keyof NewProductInput>(k: K, v: NewProductInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // The server re-validates this — it's here so the admin doesn't wait on a
    // round trip to be told a game needs a console.
    if (form.type === 'game' && !form.consoles?.length) {
      setError('Pick at least one console for this game')
      return
    }
    setBusy(true)
    setError(null)
    setMsg(null)
    try {
      const created = await createProduct({
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || Number(form.price),
      })
      // Say whether the blurb was pulled, so a failed Wikipedia lookup isn't silent.
      const blurb = form.description?.trim()
        ? ''
        : created.description
          ? ' — description pulled from Wikipedia'
          : form.wikipediaUrl?.trim()
            ? " — couldn't read that Wikipedia page, description left empty"
            : ''
      setMsg(`Added "${created.title}" (id ${created.id})${blurb}`)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product')
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      await deleteProduct(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const input =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-brand/60'

  // Only games have a Steam listing, so hardware doesn't get asked for an appid.
  const isConsole = form.type === 'console'

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-white">Admin — Products</h1>
      <p className="mt-1 text-sm text-white/60">Add or remove catalog items.</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Add form */}
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-panel/60 p-6"
        >
          <h2 className="font-semibold text-white">Add a product</h2>

          <div>
            <label className="mb-1 block text-sm text-white/70">Title</label>
            <input
              className={input}
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Type</label>
              <select
                className={input}
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as ProductType
                  setForm((f) => ({
                    ...f,
                    type,
                    steamAppid: type === 'console' ? null : f.steamAppid,
                    consoles: type === 'console' ? [] : f.consoles,
                  }))
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
              <label className="mb-1 block text-sm text-white/70">Platform</label>
              <select
                className={input}
                value={form.platform}
                onChange={(e) =>
                  // Consoles are family-scoped, so a new family invalidates the picks.
                  setForm((f) => ({ ...f, platform: e.target.value, consoles: [] }))
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

          {!isConsole && (
            <ConsolePicker
              platform={form.platform}
              value={form.consoles ?? []}
              onChange={(consoles) => set('consoles', consoles)}
            />
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Condition</label>
              <select
                className={input}
                value={form.condition}
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
                step="0.01"
                required
                value={form.price || ''}
                onChange={(e) => set('price', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/70">Was</label>
              <input
                className={input}
                type="number"
                step="0.01"
                value={form.originalPrice || ''}
                onChange={(e) => set('originalPrice', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/70">Emoji</label>
              <input
                className={input}
                value={form.emoji}
                onChange={(e) => set('emoji', e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <label className="mb-1 block text-sm text-white/70">
                Image URL <span className="text-white/40">(optional)</span>
              </label>
              <input
                className={input}
                type="url"
                placeholder="https://…  (falls back to emoji if blank)"
                value={form.imageUrl ?? ''}
                onChange={(e) => set('imageUrl', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/70">
              Description{' '}
              <span className="text-white/40">
                (optional — leave blank to pull it from the Wikipedia article below)
              </span>
            </label>
            <textarea
              className={`${input} min-h-20 resize-y`}
              rows={3}
              placeholder="Short blurb shown on the product page"
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className={isConsole ? 'col-span-3' : 'col-span-2'}>
              <label className="mb-1 block text-sm text-white/70">
                Wikipedia URL <span className="text-white/40">(optional)</span>
              </label>
              <input
                className={input}
                type="url"
                placeholder="https://en.wikipedia.org/wiki/…"
                value={form.wikipediaUrl ?? ''}
                onChange={(e) => set('wikipediaUrl', e.target.value)}
              />
            </div>
            {!isConsole && (
              <div>
                <label className="mb-1 block text-sm text-white/70">
                  Steam appid <span className="text-white/40">(optional)</span>
                </label>
                <input
                  className={input}
                  type="number"
                  min="1"
                  placeholder="1091500"
                  value={form.steamAppid ?? ''}
                  onChange={(e) =>
                    set('steamAppid', Number(e.target.value) > 0 ? Number(e.target.value) : null)
                  }
                />
              </div>
            )}
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={form.featured ?? false}
              onChange={(e) => set('featured', e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Feature on the home page
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {msg && <p className="text-sm text-mint">{msg}</p>}

          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-brand to-brand-soft px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Add product'}
          </button>
        </form>

        {/* Existing products */}
        <div className="rounded-2xl border border-white/10 bg-panel/60 p-6">
          <h2 className="font-semibold text-white">
            Catalog ({products.length})
          </h2>
          <ul className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {products.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <ProductCover
                  product={p}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-md"
                  emojiClassName="text-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">{p.title}</div>
                  <div className="text-xs text-white/40">
                    {p.consoles?.length ? p.consoles.join(', ') : p.platform} ·{' '}
                    {formatINR(p.price)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(p.id, p.title)}
                  className="rounded-lg px-2 py-1 text-xs text-white/50 transition hover:bg-white/10 hover:text-red-400"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
