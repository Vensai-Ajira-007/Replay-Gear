import { BadRequestError } from 'routing-controllers'
import { AppDataSource } from '../db/data-source.js'
import { Order } from '../entities/Order.js'
import { OrderItem } from '../entities/OrderItem.js'
import { clearCart, getCart, userCartKey } from '../store/cart.js'
import { parseDeliveryAddress } from './address.js'
import { User } from '../entities/User.js'

/**
 * Snapshot the current cart into a persisted order owned by `userId`, then clear
 * the cart. Runs in a transaction so the order, its items, and the user's saved
 * default address all commit together.
 */
export async function createOrderFromCart(
  userId: string,
  addressInput: unknown,
): Promise<Order> {
  // Validate before touching the DB so a bad address costs no transaction.
  const deliveryAddress = parseDeliveryAddress(addressInput)

  const key = userCartKey(userId)
  const cart = await getCart(key)
  if (cart.lines.length === 0) {
    throw new BadRequestError('Cart is empty')
  }

  const order = await AppDataSource.transaction(async (manager) => {
    const newOrder = manager.create(Order, {
      userId,
      status: 'paid',
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
      deliveryAddress,
      items: cart.lines.map((line) =>
        manager.create(OrderItem, {
          productId: line.product.id,
          title: line.product.title,
          unitPrice: line.product.price,
          qty: line.qty,
          lineTotal: line.lineTotal,
        }),
      ),
    })
    const saved = await manager.save(newOrder)

    // Remember it for next time. Same transaction, so a failed order never
    // leaves the profile half-updated.
    await manager.update(User, { id: userId }, { defaultAddress: deliveryAddress })

    return saved
  })

  clearCart(key)
  return order
}

// Admin passes no userId (sees all); a customer passes their id (sees own).
export async function listOrders(userId?: string): Promise<Order[]> {
  return AppDataSource.getRepository(Order).find({
    where: userId ? { userId } : {},
    order: { createdAt: 'DESC' },
  })
}

export async function getOrderById(id: string): Promise<Order | null> {
  return AppDataSource.getRepository(Order).findOne({ where: { id } })
}
