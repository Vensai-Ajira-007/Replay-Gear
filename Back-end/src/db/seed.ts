import { AppDataSource } from './data-source.js'
import { Product } from '../entities/Product.js'
import { products as seedData } from '../data/products.js'

// Insert the seed catalog on first run. Idempotent: does nothing if the
// products table already has rows.
export async function seedProducts(): Promise<void> {
  const repo = AppDataSource.getRepository(Product)
  const count = await repo.count()
  if (count > 0) {
    console.log(`🌱 Products already seeded (${count} rows) — skipping.`)
    return
  }
  await repo.save(seedData)
  console.log(`🌱 Seeded ${seedData.length} products.`)
}
