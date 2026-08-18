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

/**
 * Give a fresh database a few featured products so the home page's Featured
 * Products row isn't empty on first run.
 *
 * The NOT EXISTS guard is what makes this a one-time backfill: once anything is
 * featured, this never touches the table again, so an admin's picks survive
 * every restart. That is also why `featured` is NOT in products.seed.sql — that
 * file is a full upsert that re-runs on every boot and would reset the flag on
 * ids 1-44 each time.
 */
const DEFAULT_FEATURED_IDS = [1, 3, 9, 14]

export async function seedFeaturedDefaults(): Promise<void> {
  // Checked as its own query rather than a NOT EXISTS inside the UPDATE: the
  // driver returns [rows, rowCount] for `UPDATE ... RETURNING`, so counting the
  // result directly reports nonsense.
  const [{ count }]: [{ count: number }] = await AppDataSource.query(
    'SELECT count(*)::int AS count FROM products WHERE featured',
  )
  if (count > 0) return

  await AppDataSource.query(
    `UPDATE products SET featured = true WHERE id = ANY($1)`,
    [DEFAULT_FEATURED_IDS],
  )
  console.log(`⭐ Featured ${DEFAULT_FEATURED_IDS.length} products (first run)`)
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
