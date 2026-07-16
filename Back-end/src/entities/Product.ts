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
}
