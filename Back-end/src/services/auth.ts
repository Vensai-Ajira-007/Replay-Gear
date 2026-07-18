import bcrypt from 'bcryptjs'
import {
  BadRequestError,
  UnauthorizedError,
} from 'routing-controllers'
import { AppDataSource } from '../db/data-source.js'
import { User, type Role } from '../entities/User.js'
import { Session } from '../entities/Session.js'
import { authConfig } from '../auth/config.js'
import {
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from '../auth/tokens.js'

const userRepo = () => AppDataSource.getRepository(User)
const sessionRepo = () => AppDataSource.getRepository(Session)

export interface PublicUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface AuthResult {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

function toPublic(u: User): PublicUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role }
}

async function issueTokens(user: User): Promise<AuthResult> {
  const refreshToken = generateRefreshToken()
  const expiresAt = new Date(
    Date.now() + authConfig.refreshTtlDays * 24 * 60 * 60 * 1000,
  )
  await sessionRepo().save(
    sessionRepo().create({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    }),
  )
  return { user: toPublic(user), accessToken: signAccessToken(user), refreshToken }
}

export async function register(input: {
  name?: string
  email?: string
  password?: string
}): Promise<AuthResult> {
  const name = (input.name ?? '').trim()
  const email = (input.email ?? '').trim().toLowerCase()
  const password = input.password ?? ''
  if (!name || !email || password.length < 6) {
    throw new BadRequestError(
      'Name, email and a password of at least 6 characters are required',
    )
  }
  if (await userRepo().findOneBy({ email })) {
    throw new BadRequestError('Email already registered')
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await userRepo().save(
    userRepo().create({ name, email, passwordHash, role: 'customer' }),
  )
  return issueTokens(user)
}

export async function login(input: {
  email?: string
  password?: string
}): Promise<AuthResult> {
  const email = (input.email ?? '').trim().toLowerCase()
  const password = input.password ?? ''
  const user = await userRepo().findOneBy({ email })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password')
  }
  return issueTokens(user)
}

// Rotate: validate the old refresh token, delete it, issue a fresh pair.
export async function refresh(refreshToken?: string): Promise<AuthResult> {
  if (!refreshToken) throw new UnauthorizedError('Missing refresh token')
  const session = await sessionRepo().findOneBy({
    tokenHash: hashToken(refreshToken),
  })
  if (!session || session.expiresAt.getTime() < Date.now()) {
    if (session) await sessionRepo().delete({ id: session.id })
    throw new UnauthorizedError('Invalid or expired session')
  }
  const user = await userRepo().findOneBy({ id: session.userId })
  await sessionRepo().delete({ id: session.id })
  if (!user) throw new UnauthorizedError('User no longer exists')
  return issueTokens(user)
}

export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) return
  await sessionRepo().delete({ tokenHash: hashToken(refreshToken) })
}

export async function getUserById(id: string): Promise<User | null> {
  return userRepo().findOneBy({ id })
}

// Change the logged-in user's password: verify the current one, then re-hash.
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await getUserById(userId)
  if (!user) throw new UnauthorizedError('Not authenticated')
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new BadRequestError('Current password is incorrect')
  }
  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestError('New password must be at least 6 characters')
  }
  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await userRepo().save(user)
}
