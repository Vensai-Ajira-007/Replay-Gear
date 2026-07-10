import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import { useExpressServer } from 'routing-controllers'
import { HealthController } from './controllers/HealthController.js'
import { ProductsController } from './controllers/ProductsController.js'
import { CartController } from './controllers/CartController.js'

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(cors())
// NOTE: no express.json() here — routing-controllers does its own body parsing
// for @Body(). Adding express.json() would consume the stream first and cause
// "stream is not readable" on POST.

// Register decorator-based controllers under the /api prefix.
useExpressServer(app, {
  routePrefix: '/api',
  controllers: [HealthController, ProductsController, CartController],
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
