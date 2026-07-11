import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm'
import { numericTransformer } from '../db/numericTransformer.js'
import { Order } from './Order.js'

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  // Relation<> wrapper avoids emitDecoratorMetadata resolving `Order` at load
  // time, which would crash on the circular Order<->OrderItem import under ESM.
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  order!: Relation<Order>

  // Reference to the purchased product plus a price/title snapshot, so the order
  // keeps its historical values even if the product later changes.
  @Column({ name: 'product_id', type: 'int' })
  productId!: number

  @Column({ type: 'text' })
  title!: string

  @Column({ name: 'unit_price', type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
  unitPrice!: number

  @Column({ type: 'int' })
  qty!: number

  @Column({ name: 'line_total', type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
  lineTotal!: number
}
