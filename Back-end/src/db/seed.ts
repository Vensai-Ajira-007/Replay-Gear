import { readFileSync } from 'node:fs'
import bcrypt from 'bcryptjs'
import { AppDataSource } from './data-source.js'
import { User } from '../entities/User.js'
import { authConfig } from '../auth/config.js'

// Sync the product catalog from products.seed.sql — the source of truth for the
// storefront's products (data lives in SQL, not compiled code). The statement is
// an idempotent upsert (INSERT ... ON CONFLICT), so this is safe to run on every
// boot: a fresh DB gets every product, an already-populated DB (local/prod) picks
// up new rows and has still-empty images backfilled, without clobbering existing
// prices or admin edits. The .sql sits next to this module (copied into dist/ by
// the build), resolved relative to it so it works under both tsx and node.
export async function seedProductsFromSql(): Promise<void> {
  const sql = readFileSync(new URL('./products.seed.sql', import.meta.url), 'utf8')
  await AppDataSource.query(sql)
  console.log('🌱 Product catalog synced from products.seed.sql')
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
