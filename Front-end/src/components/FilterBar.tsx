import { platforms, types, type ProductType } from '../data/products'

export type SortKey = 'featured' | 'price-asc' | 'price-desc'
export type TypeFilter = 'all' | ProductType

interface FilterBarProps {
  // Optional — omit on category pages where the type is fixed by the route.
  typeFilter?: TypeFilter
  onTypeChange?: (value: TypeFilter) => void
  platformFilter: string
  onPlatformChange: (value: string) => void
  sort: SortKey
  onSortChange: (value: SortKey) => void
  resultCount: number
}

export default function FilterBar({
  typeFilter,
  onTypeChange,
  platformFilter,
  onPlatformChange,
  sort,
  onSortChange,
  resultCount,
}: FilterBarProps) {
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
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                platformFilter === p
                  ? 'border-brand/60 bg-brand/15 text-brand-soft'
                  : 'border-white/10 text-white/60 hover:border-white/25 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
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
