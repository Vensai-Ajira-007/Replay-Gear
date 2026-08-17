import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

// A forgot-password attempt, in one of two states:
// 1. code issued  → codeHash set, tokenHash null. The user has an emailed OTP.
// 2. code spent   → codeHash null, tokenHash set. The OTP was verified and
//    exchanged for a one-time reset token; only that token can set a password.
// Like Session, we store hashes only — never the raw code or token.
@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string

  @Column({ name: 'code_hash', type: 'text', nullable: true })
  codeHash!: string | null

  @Index()
  @Column({ name: 'token_hash', type: 'text', nullable: true })
  tokenHash!: string | null

  // Wrong-code counter; the row is dropped once it hits the configured max.
  @Column({ type: 'int', default: 0 })
  attempts!: number

  // Re-stamped when the OTP is exchanged, so the reset token gets its own TTL.
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date

  // timestamptz explicitly: the resend throttle does date arithmetic on this,
  // and TypeORM's default `timestamp` (no zone) is read back as local time —
  // on a non-UTC host that makes every row look hours old.
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date
}
