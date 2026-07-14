import { BadRequestError } from 'routing-controllers'
import { AppDataSource } from '../db/data-source.js'
import { Order } from '../entities/Order.js'
import { OrderItem } from '../entities/OrderItem.js'
import { clearCart, getCart } from '../store/cart.js'

/**
 * Snapshot the current cart into a persisted order owned by `userId`, then clear
 * the cart. Runs in a transaction so order + items save atomically.
 */
export async function createOrderFromCart(userId: string): Promise<Order> {
  const cart = await getCart()
  if (cart.lines.length === 0) {
    throw new BadRequestError('Cart is empty')
  }

  const order = await AppDataSource.transaction(async (manager) => {
    const newOrder = manager.create(Order, {
      userId,
      status: 'paid',
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
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
    return manager.save(newOrder)
  })

  clearCart()
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
