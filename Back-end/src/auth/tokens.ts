import jwt from 'jsonwebtoken'
import { createHash, randomBytes } from 'node:crypto'
import { authConfig } from './config.js'
import type { Role, User } from '../entities/User.js'

export interface AccessPayload {
  sub: string
  role: Role
  email: string
  name: string
}

export function signAccessToken(user: User): string {
  const payload = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  }
  return jwt.sign(payload, authConfig.accessSecret, {
    expiresIn: authConfig.accessTtlSeconds,
  })
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, authConfig.accessSecret) as AccessPayload
}

/** Opaque refresh token (raw value handed to the client). */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex')
}

/** We store only a hash of the refresh token in the DB. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
