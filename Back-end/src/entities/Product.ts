import { Column, Entity, PrimaryColumn } from 'typeorm'
import { numericTransformer } from '../db/numericTransformer.js'

export type ProductType = 'game' | 'console'
export type Condition = 'Mint' | 'Good' | 'Fair'

@Entity('products')
export class Product {
  // Non-generated PK so seeded ids (1–14) stay stable and match the frontend.
  @PrimaryColumn({ type: 'int' })
  id!: number

  @Column({ type: 'text' })
  title!: string

  @Column({ type: 'varchar', length: 16 })
  type!: ProductType

  @Column({ type: 'varchar', length: 32 })
  platform!: string

  // The specific machines a game runs on within its platform family, e.g.
  // ['PS4', 'PS5']. Always empty for hardware.
  @Column({ type: 'text', array: true, default: () => "'{}'" })
  consoles!: string[]

  @Column({ type: 'varchar', length: 8 })
  condition!: Condition

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
  price!: number

  @Column({
    name: 'original_price',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  originalPrice!: number

  @Column({ type: 'numeric', precision: 3, scale: 1, transformer: numericTransformer })
  rating!: number

  @Column({ type: 'text' })
  emoji!: string

  @Column({ type: 'text' })
  accent!: string

  // Real cover art / console photo (remote URL). Nullable — falls back to the
  // emoji + accent gradient on the frontend when absent or the image fails.
  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl!: string | null

  // Short blurb shown on the product page. For seeded products this is a brief
  // quote from the linked Wikipedia article (see scripts/fetch-wikipedia.mjs);
  // admin-added products may leave it empty.
  @Column({ type: 'text', nullable: true })
  description!: string | null

  // Source article for the description, and a "read more" link on the product page.
  @Column({ name: 'wikipedia_url', type: 'text', nullable: true })
  wikipediaUrl!: string | null

  // Steam application id, used to look up a live INR price. Null for hardware and
  // for titles that aren't on Steam (the Nintendo catalogue).
  @Column({ name: 'steam_appid', type: 'int', nullable: true })
  steamAppid!: number | null

  // Hand-picked by an admin for the home page's Featured Products row.
  // Deliberately not driven by products.seed.sql — see seedFeaturedDefaults().
  @Column({ type: 'boolean', default: false })
  featured!: boolean

  // Set at read time by the catalog service, never persisted — tells the frontend
  // whether the price it received came from Steam or from this table.
  priceSource?: 'steam' | 'store'
}
