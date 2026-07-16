import 'reflect-metadata'
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { useExpressServer } from 'routing-controllers'
import { AppDataSource } from './db/data-source.js'
import { seedAdmin, seedProductsFromSql } from './db/seed.js'
import {
  authorizationChecker,
  currentUserChecker,
} from './auth/authChecker.js'
import { HealthController } from './controllers/HealthController.js'
import { ProductsController } from './controllers/ProductsController.js'
import { CartController } from './controllers/CartController.js'
import { OrdersController } from './controllers/OrdersController.js'
import { AuthController } from './controllers/AuthController.js'

const PORT = Number(process.env.PORT) || 4000

async function main() {
  // Connect to Postgres, create tables (synchronize), and seed the catalog.
  await AppDataSource.initialize()
  console.log('🗄️  Database connected')
  await seedProductsFromSql()
  await seedAdmin()

  const app = express()
  app.use(cors())
  // Log every incoming request (method, path, status, response time) so you can
  // watch endpoints being hit in the container logs.
  app.use(morgan('dev'))
  // NOTE: no express.json() here — routing-controllers does its own body parsing
  // for @Body(). Adding express.json() would consume the stream first and cause
  // "stream is not readable" on POST.

  useExpressServer(app, {
    routePrefix: '/api',
    controllers: [
      HealthController,
      AuthController,
      ProductsController,
      CartController,
      OrdersController,
    ],
    cors: false, // handled by the express cors() middleware above
    classTransformer: false,
    validation: false,
    defaultErrorHandler: true,
    // JWT auth: powers @Authorized()/@Authorized('admin') and @CurrentUser().
    authorizationChecker,
    currentUserChecker,
  })

  // Fallback 404 for anything not matched by a controller.
  // routing-controllers calls next() after handling an action, so this runs
  // even on matched routes — guard against double-sending the response.
  app.use((_req, res, next) => {
    if (res.headersSent) return next()
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
