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
import { publishNotification } from '../kafka/producer.js'

@JsonController('/orders')
export class OrdersController {
  // POST /api/orders — checkout (must be logged in); order is tied to the user
  @Post('/')
  @HttpCode(201)
  @Authorized()
  async create(@CurrentUser() user: AccessPayload) {
    const order = await createOrderFromCart(user.sub)

    // Fire-and-forget: publish an event for the notification service to email.
    // A Kafka failure must never fail the checkout, so we only log it.
    publishNotification({
      type: 'order.created',
      user: { email: user.email, name: user.name },
      order: {
        id: order.id,
        totalItems: order.totalItems,
        subtotal: order.subtotal,
        items: order.items.map((i) => ({
          title: i.title,
          qty: i.qty,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
        })),
      },
    })
      .then(() => console.log(`📤 published order.created ${order.id}`))
      .catch((err) => console.error('failed to publish order.created:', err))

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
