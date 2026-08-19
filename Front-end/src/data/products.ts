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
  /** The machines a game runs on, e.g. ['PS4', 'PS5']. Empty for hardware. */
  consoles?: string[]
  condition: Condition
  price: number
  originalPrice: number
  rating: number
  emoji: string
  /** Tailwind gradient classes used for the cover tile. */
  accent: string
  /** Real cover art / console photo. Falls back to emoji+accent if missing. */
  imageUrl?: string | null
  /** Short blurb on the product page. Seeded ones quote the Wikipedia article. */
  description?: string | null
  /** Source article for the description; also the "read more" link. */
  wikipediaUrl?: string | null
  /** Steam app id, when the title is on Steam. Drives the live INR price. */
  steamAppid?: number | null
  /** Whether the price came from Steam or from the store's own database. */
  priceSource?: 'steam' | 'store'
  /** Hand-picked by an admin for the home page's Featured Products row. */
  featured?: boolean
}

export const types: { key: 'all' | ProductType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'game', label: 'Games' },
  { key: 'console', label: 'Consoles' },
]

export const platforms = ['All', 'PlayStation', 'Xbox', 'Nintendo', 'PC'] as const

/**
 * The machines a game can be listed for, grouped by platform family. No 'All'
 * sentinel here — the filter bar adds that pill itself. Mirrored by
 * CONSOLES_BY_PLATFORM in the backend's catalog service, which validates saves.
 */
export const consolesByPlatform: Record<string, string[]> = {
  PlayStation: ['PS1', 'PS2', 'PS3', 'PS4', 'PS5'],
  Xbox: ['Xbox', 'Xbox 360', 'Xbox One', 'Xbox Series X|S'],
  Nintendo: [
    'NES',
    'SNES',
    'N64',
    'GameCube',
    'Wii',
    'Wii U',
    'DS',
    '3DS',
    'Switch',
    'Switch 2',
  ],
  PC: ['Windows PC', 'Steam Deck'],
}

/** Reverse lookup: 'PS2' → 'PlayStation'. Drives the badge colour on covers. */
export const consoleFamily: Record<string, string> = Object.fromEntries(
  Object.entries(consolesByPlatform).flatMap(([family, models]) =>
    models.map((model) => [model, family]),
  ),
)

export const conditionColor: Record<Condition, string> = {
  Mint: 'bg-mint/15 text-mint ring-mint/30',
  Good: 'bg-good/15 text-good ring-good/30',
  Fair: 'bg-fair/15 text-fair ring-fair/30',
}
