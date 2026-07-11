import {
  Get,
  HttpCode,
  JsonController,
  NotFoundError,
  Param,
  Post,
} from 'routing-controllers'
import {
  createOrderFromCart,
  getOrderById,
  listOrders,
} from '../services/orders.js'

@JsonController('/orders')
export class OrdersController {
  // POST /api/orders — create an order from the current cart (one-click checkout)
  @Post('/')
  @HttpCode(201)
  async create() {
    const order = await createOrderFromCart()
    return { order }
  }

  // GET /api/orders — list all orders, newest first
  @Get('/')
  async list() {
    const orders = await listOrders()
    return { orders }
  }

  // GET /api/orders/:id
  @Get('/:id')
  async getOne(@Param('id') id: string) {
    const order = await getOrderById(id)
    if (!order) {
      throw new NotFoundError('Order not found')
    }
    return { order }
  }
}
