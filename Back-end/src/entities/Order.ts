import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm'
import { numericTransformer } from '../db/numericTransformer.js'
import { OrderItem } from './OrderItem.js'

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @Column({ type: 'varchar', length: 16, default: 'paid' })
  status!: string

  @Column({ name: 'total_items', type: 'int' })
  totalItems!: number

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: numericTransformer })
  subtotal!: number

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items!: Relation<OrderItem[]>
}
