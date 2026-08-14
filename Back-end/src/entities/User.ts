import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'
import type { DeliveryAddress } from '../services/address.js'

export type Role = 'admin' | 'customer'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 120 })
  name!: string

  @Column({ type: 'varchar', length: 160, unique: true })
  email!: string

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string

  @Column({ type: 'varchar', length: 16, default: 'customer' })
  role!: Role

  // Saved default delivery address, used to prefill checkout. Null until the
  // user places their first order or saves one from their profile.
  @Column({ name: 'default_address', type: 'jsonb', nullable: true })
  defaultAddress!: DeliveryAddress | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
