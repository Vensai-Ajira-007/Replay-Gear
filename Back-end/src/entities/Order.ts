import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm'
import { numericTransformer } from '../db/numericTransformer.js'
import type { DeliveryAddress } from '../services/address.js'
import { OrderItem } from './OrderItem.js'

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  // Owner of the order (the logged-in customer who checked out).
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null

  @Column({ type: 'varchar', length: 16, default: 'paid' })
  status!: string

  @Column({ name: 'total_items', type: 'int' })
  totalItems!: number

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
  subtotal!: number

  // Immutable snapshot of where this order shipped, so editing the saved profile
  // address later never rewrites history. Nullable: orders placed before delivery
  // details existed have none.
  @Column({ name: 'delivery_address', type: 'jsonb', nullable: true })
  deliveryAddress!: DeliveryAddress | null

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: Relation<OrderItem[]>
}
