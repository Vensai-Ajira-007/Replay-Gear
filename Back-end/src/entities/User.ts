import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
