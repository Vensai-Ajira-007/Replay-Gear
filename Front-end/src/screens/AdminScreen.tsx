import { useEffect, useState, type FormEvent } from 'react'
import { platforms, type Condition, type Product, type ProductType } from '../data/products'
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  type NewProductInput,
} from '../lib/api'

const emptyForm: NewProductInput = {
  title: '',
  type: 'game',
  platform: 'PlayStation',
  condition: 'Good',
  price: 0,
  originalPrice: 0,
  emoji: '🎮',
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
    setBusy(true)
    setError(null)
    setMsg(null)
    try {
      const created = await createProduct({
        ...form,
        price: Number(form.price),
        originalPrice: Number(form.originalPrice) || Number(form.price),
      })
      setMsg(`Added "${created.title}" (id ${created.id})`)
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
                value={form.platform}
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

          <div>
            <label className="mb-1 block text-sm text-white/70">Emoji</label>
            <input
              className={input}
              value={form.emoji}
              onChange={(e) => set('emoji', e.target.value)}
            />
          </div>

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
                <span className="text-xl">{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">{p.title}</div>
                  <div className="text-xs text-white/40">
                    {p.platform} · ${p.price.toFixed(2)}
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
