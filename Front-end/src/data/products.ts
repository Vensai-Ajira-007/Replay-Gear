// Shared types + UI/presentation helpers for the storefront.
// The product catalog itself now comes from the backend API
// (see src/lib/api.ts); this file only holds the shape + display constants.

export type ProductType = 'game' | 'console'
export type Condition = 'Mint' | 'Good' | 'Fair'

export interface Product {
  id: number
  title: string
  type: ProductType
  platform: string
  condition: Condition
  price: number
  originalPrice: number
  rating: number
  emoji: string
  /** Tailwind gradient classes used for the cover tile. */
  accent: string
}

export const types: { key: 'all' | ProductType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'game', label: 'Games' },
  { key: 'console', label: 'Consoles' },
]

export const platforms = ['All', 'PlayStation', 'Xbox', 'Nintendo', 'PC'] as const

export const conditionColor: Record<Condition, string> = {
  Mint: 'bg-mint/15 text-mint ring-mint/30',
  Good: 'bg-good/15 text-good ring-good/30',
  Fair: 'bg-fair/15 text-fair ring-fair/30',
}
