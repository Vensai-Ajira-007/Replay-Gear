import { consolesByPlatform, platforms, types, type ProductType } from '../data/products'

export type SortKey = 'featured' | 'price-asc' | 'price-desc'
export type TypeFilter = 'all' | ProductType

interface FilterBarProps {
  // Optional — omit on category pages where the type is fixed by the route.
  typeFilter?: TypeFilter
  onTypeChange?: (value: TypeFilter) => void
  platformFilter: string
  onPlatformChange: (value: string) => void
  // Also optional — only games carry consoles, so /consoles omits these.
  consoleFilter?: string
  onConsoleChange?: (value: string) => void
  showConsoles?: boolean
  sort: SortKey
  onSortChange: (value: SortKey) => void
  resultCount: number
}

const pill = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm transition ${
    active
      ? 'border-brand/60 bg-brand/15 text-brand-soft'
      : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white'
  }`

export default function FilterBar({
  typeFilter,
  onTypeChange,
  platformFilter,
  onPlatformChange,
  consoleFilter = 'All',
  onConsoleChange,
  showConsoles = false,
  sort,
  onSortChange,
  resultCount,
}: FilterBarProps) {
  // Only offered once a family is chosen — otherwise it'd be ~20 pills at once,
  // and models from different families can't be compared anyway.
  const consoleOptions =
    showConsoles && onConsoleChange && platformFilter !== 'All'
      ? ['All', ...(consolesByPlatform[platformFilter] ?? [])]
      : []

  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {/* Type segmented control — only when the caller manages a type filter */}
        {onTypeChange && (
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            {types.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onTypeChange(t.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  typeFilter === t.key
                    ? 'bg-brand text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Platform pills */}
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPlatformChange(p)}
              className={pill(platformFilter === p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Console pills — a second row, once a platform family is picked */}
        {consoleOptions.length > 0 && (
          <div className="flex basis-full flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-white/40">Console</span>
            {consoleOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onConsoleChange?.(c)}
                className={pill(consoleFilter === c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-white/50">{resultCount} items</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none transition focus:border-brand/60"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  )
}
