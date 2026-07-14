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
