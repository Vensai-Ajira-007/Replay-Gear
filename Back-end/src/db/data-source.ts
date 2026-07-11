import { DataSource } from 'typeorm'
import { Product } from '../entities/Product.js'
import { Order } from '../entities/Order.js'
import { OrderItem } from '../entities/OrderItem.js'

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.PGHOST ?? 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  username: process.env.PGUSER ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
  database: process.env.PGDATABASE ?? 'replaygear',
  // Explicit entity classes (not glob paths) — ESM-safe.
  entities: [Product, Order, OrderItem],
  // Dev convenience: auto-create/update tables from entities. Swap for
  // migrations in production.
  synchronize: true,
  logging: false,
})
