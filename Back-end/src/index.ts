import 'reflect-metadata'
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { useExpressServer } from 'routing-controllers'
import { AppDataSource } from './db/data-source.js'
import { seedProducts } from './db/seed.js'
import { HealthController } from './controllers/HealthController.js'
import { ProductsController } from './controllers/ProductsController.js'
import { CartController } from './controllers/CartController.js'
import { OrdersController } from './controllers/OrdersController.js'

const PORT = Number(process.env.PORT) || 4000

async function main() {
  // Connect to Postgres, create tables (synchronize), and seed the catalog.
  await AppDataSource.initialize()
  console.log('🗄️  Database connected')
  await seedProducts()

  const app = express()
  app.use(cors())
  // NOTE: no express.json() here — routing-controllers does its own body parsing
  // for @Body(). Adding express.json() would consume the stream first and cause
  // "stream is not readable" on POST.

  useExpressServer(app, {
    routePrefix: '/api',
    controllers: [
      HealthController,
      ProductsController,
      CartController,
      OrdersController,
    ],
    cors: false, // handled by the express cors() middleware above
    classTransformer: false,
    validation: false,
    defaultErrorHandler: true,
  })

  // Fallback 404 for anything not matched by a controller.
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  app.listen(PORT, () => {
    console.log(`🎮 ReplayGear API running on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
