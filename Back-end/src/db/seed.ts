import bcrypt from 'bcryptjs'
import { AppDataSource } from './data-source.js'
import { Product } from '../entities/Product.js'
import { User } from '../entities/User.js'
import { products as seedData } from '../data/products.js'
import { authConfig } from '../auth/config.js'

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

// Insert any seed products whose id isn't in the DB yet. Idempotent and safe on
// every boot: an already-seeded database (local/prod) picks up newly-added
// catalog entries without a wipe or manual SQL. Existing rows are left untouched
// so prices and admin edits are never clobbered.
export async function insertMissingProducts(): Promise<void> {
  const repo = AppDataSource.getRepository(Product)
  const existing = await repo.find({ select: { id: true } })
  const ids = new Set(existing.map((p) => p.id))
  const missing = seedData.filter((p) => !ids.has(p.id))
  if (missing.length === 0) return
  await repo.save(missing)
  console.log(`🌱 Inserted ${missing.length} new products.`)
}

// Backfill cover art / console photos onto already-seeded rows. Idempotent and
// safe to run on every boot: sets image_url on the known seed ids so an
// existing database (e.g. prod) picks up images without a manual SQL update.
// Skips rows that already carry an image so admin/manual edits aren't clobbered.
export async function backfillProductImages(): Promise<void> {
  const repo = AppDataSource.getRepository(Product)
  let updated = 0
  for (const p of seedData) {
    if (!p.imageUrl) continue
    const result = await repo
      .createQueryBuilder()
      .update(Product)
      .set({ imageUrl: p.imageUrl })
      .where('id = :id', { id: p.id })
      .andWhere("(image_url IS NULL OR image_url = '')")
      .execute()
    updated += result.affected ?? 0
  }
  if (updated > 0) console.log(`🖼️  Backfilled images on ${updated} products.`)
}

// Create the default admin account on first run if it doesn't exist.
export async function seedAdmin(): Promise<void> {
  const repo = AppDataSource.getRepository(User)
  const email = authConfig.adminEmail.toLowerCase()
  if (await repo.findOneBy({ email })) {
    console.log('👤 Admin already exists — skipping.')
    return
  }
  const passwordHash = await bcrypt.hash(authConfig.adminPassword, 10)
  await repo.save(
    repo.create({
      name: authConfig.adminName,
      email,
      passwordHash,
      role: 'admin',
    }),
  )
  console.log(`👤 Seeded admin user: ${email}`)
}
