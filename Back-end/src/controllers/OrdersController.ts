import {
  Authorized,
  CurrentUser,
  ForbiddenError,
  Get,
  HttpCode,
  JsonController,
  NotFoundError,
  Param,
  Post,
} from 'routing-controllers'
import type { AccessPayload } from '../auth/tokens.js'
import {
  createOrderFromCart,
  getOrderById,
  listOrders,
} from '../services/orders.js'
import { sendOrderConfirmation } from '../mail/orderConfirmation.js'

@JsonController('/orders')
export class OrdersController {
  // POST /api/orders — checkout (must be logged in); order is tied to the user
  @Post('/')
  @HttpCode(201)
  @Authorized()
  async create(@CurrentUser() user: AccessPayload) {
    const order = await createOrderFromCart(user.sub)

    // Fire-and-forget: emailing must never block or fail the checkout.
    sendOrderConfirmation(order, user.email, user.name)
      .then(() => console.log(`✉️  order confirmation sent → ${user.email}`))
      .catch((err) => console.error('order email failed:', err))

    return { order }
  }

  // GET /api/orders — admin sees all; a customer sees only their own
  @Get('/')
  @Authorized()
  async list(@CurrentUser() user: AccessPayload) {
    const orders = await listOrders(user.role === 'admin' ? undefined : user.sub)
    return { orders }
  }

  // GET /api/orders/:id — owner or admin only
  @Get('/:id')
  @Authorized()
  async getOne(@Param('id') id: string, @CurrentUser() user: AccessPayload) {
    const order = await getOrderById(id)
    if (!order) throw new NotFoundError('Order not found')
    if (user.role !== 'admin' && order.userId !== user.sub) {
      throw new ForbiddenError('Not your order')
    }
    return { order }
  }
}
