import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

// A refresh/"session" token, stored server-side so it can be revoked (logout).
// We store a hash of the token, never the raw value.
@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string

  @Column({ name: 'token_hash', type: 'text' })
  tokenHash!: string

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}
