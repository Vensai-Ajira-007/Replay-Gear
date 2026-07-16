// Seed data for the catalog — inserted into Postgres on first run (see
// src/db/seed.ts). At runtime the API reads products from the database, not
// this array. Each product has real cover art / a console photo (imageUrl);
// the emoji + gradient is the fallback the frontend shows if the image is
// missing or fails to load. Prices are in INR (whole rupees).

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
  /** Tailwind gradient classes used for the cover tile on the frontend. */
  accent: string
  /** Real cover art / console photo (remote URL). */
  imageUrl: string
}

// Image hosts — defined once and reused for every product's cover art below.
const WIKIMEDIA = 'https://upload.wikimedia.org/wikipedia'
/** Steam library poster (portrait cover art) for a given Steam app id. */
const steamPoster = (appId: number): string =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`

export const products: Product[] = [
  {
    id: 1,
    title: 'Elden Ring',
    type: 'game',
    platform: 'PlayStation',
    condition: 'Mint',
    price: 2904,
    originalPrice: 4979,
    rating: 4.9,
    emoji: '⚔️',
    accent: 'from-amber-500/30 to-brand/30',
    imageUrl: steamPoster(1245620),
  },
  {
    id: 2,
    title: 'God of War Ragnarök',
    type: 'game',
    platform: 'PlayStation',
    condition: 'Good',
    price: 2489,
    originalPrice: 4149,
    rating: 4.8,
    emoji: '🪓',
    accent: 'from-blue-500/30 to-cyan-400/30',
    imageUrl: steamPoster(2322010),
  },
  {
    id: 3,
    title: 'The Legend of Zelda: Tears of the Kingdom',
    type: 'game',
    platform: 'Nintendo',
    condition: 'Mint',
    price: 3734,
    originalPrice: 5809,
    rating: 4.9,
    emoji: '🗡️',
    accent: 'from-emerald-500/30 to-lime-400/30',
    imageUrl: `${WIKIMEDIA}/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg`,
  },
  {
    id: 4,
    title: 'Mario Kart 8 Deluxe',
    type: 'game',
    platform: 'Nintendo',
    condition: 'Good',
    price: 3319,
    originalPrice: 4979,
    rating: 4.7,
    emoji: '🏎️',
    accent: 'from-red-500/30 to-orange-400/30',
    imageUrl: `${WIKIMEDIA}/en/b/b5/MarioKart8Boxart.jpg`,
  },
  {
    id: 5,
    title: 'Halo Infinite',
    type: 'game',
    platform: 'Xbox',
    condition: 'Fair',
    price: 1659,
    originalPrice: 4149,
    rating: 4.3,
    emoji: '🪖',
    accent: 'from-green-500/30 to-teal-400/30',
    imageUrl: steamPoster(1240440),
  },
  {
    id: 6,
    title: 'Cyberpunk 2077',
    type: 'game',
    platform: 'PC',
    condition: 'Good',
    price: 2074,
    originalPrice: 4979,
    rating: 4.5,
    emoji: '🌆',
    accent: 'from-yellow-400/30 to-fuchsia-500/30',
    imageUrl: steamPoster(1091500),
  },
  {
    id: 7,
    title: 'Forza Horizon 5',
    type: 'game',
    platform: 'Xbox',
    condition: 'Mint',
    price: 2738,
    originalPrice: 4979,
    rating: 4.8,
    emoji: '🚗',
    accent: 'from-purple-500/30 to-pink-400/30',
    imageUrl: steamPoster(1551360),
  },
  {
    id: 8,
    title: 'Baldur’s Gate 3',
    type: 'game',
    platform: 'PC',
    condition: 'Mint',
    price: 3319,
    originalPrice: 4979,
    rating: 5.0,
    emoji: '🐉',
    accent: 'from-rose-500/30 to-amber-400/30',
    imageUrl: steamPoster(1086940),
  },
  {
    id: 9,
    title: 'PlayStation 5 (Slim)',
    type: 'console',
    platform: 'PlayStation',
    condition: 'Good',
    price: 31539,
    originalPrice: 41499,
    rating: 4.8,
    emoji: '🎮',
    accent: 'from-blue-600/40 to-indigo-500/30',
    imageUrl: `${WIKIMEDIA}/commons/thumb/7/77/Black_and_white_Playstation_5_base_edition_with_controller.png/960px-Black_and_white_Playstation_5_base_edition_with_controller.png`,
  },
  {
    id: 10,
    title: 'Xbox Series X',
    type: 'console',
    platform: 'Xbox',
    condition: 'Mint',
    price: 33199,
    originalPrice: 41499,
    rating: 4.9,
    emoji: '🟩',
    accent: 'from-green-600/40 to-emerald-500/30',
    imageUrl: `${WIKIMEDIA}/commons/thumb/1/12/Xbox_Series_X_2.jpg/960px-Xbox_Series_X_2.jpg`,
  },
  {
    id: 11,
    title: 'Nintendo Switch OLED',
    type: 'console',
    platform: 'Nintendo',
    condition: 'Good',
    price: 24069,
    originalPrice: 29049,
    rating: 4.7,
    emoji: '🕹️',
    accent: 'from-red-500/40 to-rose-400/30',
    imageUrl: `${WIKIMEDIA}/commons/thumb/8/80/Nintendo_Switch_%E2%80%93_OLED-Modell%2C_Konsole_und_Dock_20230506.png/960px-Nintendo_Switch_%E2%80%93_OLED-Modell%2C_Konsole_und_Dock_20230506.png`,
  },
  {
    id: 12,
    title: 'PlayStation 4 Slim',
    type: 'console',
    platform: 'PlayStation',
    condition: 'Fair',
    price: 12449,
    originalPrice: 24899,
    rating: 4.2,
    emoji: '🎮',
    accent: 'from-slate-500/40 to-blue-400/30',
    imageUrl: `${WIKIMEDIA}/commons/thumb/7/7e/PS4-Console-wDS4.jpg/960px-PS4-Console-wDS4.jpg`,
  },
  {
    id: 13,
    title: 'Xbox Series S',
    type: 'console',
    platform: 'Xbox',
    condition: 'Good',
    price: 18259,
    originalPrice: 24899,
    rating: 4.6,
    emoji: '⬜',
    accent: 'from-neutral-400/40 to-emerald-400/30',
    imageUrl: `${WIKIMEDIA}/commons/thumb/5/54/Xbox_Series_S_with_controller.jpg/960px-Xbox_Series_S_with_controller.jpg`,
  },
  {
    id: 14,
    title: 'Red Dead Redemption 2',
    type: 'game',
    platform: 'PlayStation',
    condition: 'Good',
    price: 2323,
    originalPrice: 4979,
    rating: 4.9,
    emoji: '🤠',
    accent: 'from-orange-600/30 to-red-500/30',
    imageUrl: steamPoster(1174180),
  },
]
