import { DataSource } from 'typeorm'
import { Product } from '../entities/Product.js'
import { Order } from '../entities/Order.js'
import { OrderItem } from '../entities/OrderItem.js'
import { User } from '../entities/User.js'
import { Session } from '../entities/Session.js'

// A single DATABASE_URL (e.g. from Neon/Render) takes precedence and connects
// over SSL; otherwise fall back to the discrete PG* vars (local / docker-compose).
const databaseUrl = process.env.DATABASE_URL

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.PGHOST ?? 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        username: process.env.PGUSER ?? 'postgres',
        password: process.env.PGPASSWORD ?? 'postgres',
        database: process.env.PGDATABASE ?? 'replaygear',
      }),
  // Explicit entity classes (not glob paths) — ESM-safe.
  entities: [Product, Order, OrderItem, User, Session],
  // Dev convenience: auto-create/update tables from entities. Swap for
  // migrations in production.
  synchronize: true,
  logging: false,
})
