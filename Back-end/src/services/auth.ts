import bcrypt from 'bcryptjs'
import { randomInt } from 'node:crypto'
import {
  BadRequestError,
  UnauthorizedError,
} from 'routing-controllers'
import { AppDataSource } from '../db/data-source.js'
import { User, type Role } from '../entities/User.js'
import { Session } from '../entities/Session.js'
import { PasswordReset } from '../entities/PasswordReset.js'
import { authConfig } from '../auth/config.js'
import { sendPasswordResetOtp } from '../mail/passwordReset.js'
import { parseDeliveryAddress, type DeliveryAddress } from './address.js'
import {
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from '../auth/tokens.js'

const userRepo = () => AppDataSource.getRepository(User)
const sessionRepo = () => AppDataSource.getRepository(Session)
const resetRepo = () => AppDataSource.getRepository(PasswordReset)

export interface PublicUser {
  id: string
  name: string
  email: string
  role: Role
  defaultAddress: DeliveryAddress | null
}

export interface AuthResult {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

export function toPublic(u: User): PublicUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    defaultAddress: u.defaultAddress ?? null,
  }
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

// Save/replace the logged-in user's default delivery address.
export async function updateDefaultAddress(
  userId: string,
  input: unknown,
): Promise<User> {
  const user = await getUserById(userId)
  if (!user) throw new UnauthorizedError('Not authenticated')
  user.defaultAddress = parseDeliveryAddress(input)
  return userRepo().save(user)
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

const normalizeEmail = (email?: string) => (email ?? '').trim().toLowerCase()

/**
 * Step 1 of the forgot-password flow: email a 6-digit OTP.
 *
 * Resolves regardless of whether the address is registered — the controller
 * always answers { ok: true } so this endpoint can't be used to discover which
 * emails have accounts.
 */
export async function requestPasswordReset(email?: string): Promise<void> {
  const user = await userRepo().findOneBy({ email: normalizeEmail(email) })
  if (!user) return

  // Resend throttle: one mail per account per window, no matter how many times
  // the button is clicked.
  const existing = await resetRepo().findOneBy({ userId: user.id })
  if (
    existing &&
    Date.now() - existing.createdAt.getTime() <
      authConfig.resetOtpResendSeconds * 1000
  ) {
    return
  }

  // randomInt, not Math.random — this is a credential.
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')

  // One live attempt per user: a new code invalidates the previous one.
  await resetRepo().delete({ userId: user.id })
  await resetRepo().save(
    resetRepo().create({
      userId: user.id,
      codeHash: hashToken(code),
      tokenHash: null,
      attempts: 0,
      expiresAt: new Date(
        Date.now() + authConfig.resetOtpTtlMinutes * 60 * 1000,
      ),
    }),
  )

  // Fire-and-forget: a mail failure must not change the response shape.
  sendPasswordResetOtp(user.email, user.name, code)
    .then(() => console.log(`✉️  password reset code sent → ${user.email}`))
    .catch((err) => console.error('password reset email failed:', err))
}

/**
 * Step 2: exchange a valid OTP for a one-time reset token.
 *
 * Every failure returns the same message — a distinct "no such email" or
 * "expired" would turn this into an oracle.
 */
export async function verifyPasswordResetOtp(
  email?: string,
  code?: string,
): Promise<{ resetToken: string }> {
  const invalid = () => new BadRequestError('Invalid or expired code')

  const user = await userRepo().findOneBy({ email: normalizeEmail(email) })
  if (!user) throw invalid()

  const reset = await resetRepo().findOneBy({ userId: user.id })
  // codeHash is null once the OTP has already been spent.
  if (!reset || !reset.codeHash) throw invalid()
  if (reset.expiresAt.getTime() < Date.now()) {
    await resetRepo().delete({ id: reset.id })
    throw invalid()
  }

  if (reset.codeHash !== hashToken((code ?? '').trim())) {
    reset.attempts += 1
    if (reset.attempts >= authConfig.resetOtpMaxAttempts) {
      await resetRepo().delete({ id: reset.id })
    } else {
      await resetRepo().save(reset)
    }
    throw invalid()
  }

  const resetToken = generateRefreshToken()
  reset.codeHash = null
  reset.tokenHash = hashToken(resetToken)
  reset.attempts = 0
  reset.expiresAt = new Date(
    Date.now() + authConfig.resetTokenTtlMinutes * 60 * 1000,
  )
  await resetRepo().save(reset)

  return { resetToken }
}

/**
 * Step 3: set the new password using the token from step 2, then log every
 * device out — a reset is the fix for a compromised account, so any refresh
 * token an attacker holds has to die with it.
 */
export async function resetPassword(
  resetToken?: string,
  newPassword?: string,
): Promise<void> {
  const invalid = () => new BadRequestError('Invalid or expired reset token')
  if (!resetToken) throw invalid()

  const reset = await resetRepo().findOneBy({ tokenHash: hashToken(resetToken) })
  // codeHash still set means the row was never verified — token can't be real.
  if (!reset || reset.codeHash) throw invalid()
  if (reset.expiresAt.getTime() < Date.now()) {
    await resetRepo().delete({ id: reset.id })
    throw invalid()
  }

  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestError('New password must be at least 6 characters')
  }

  const user = await userRepo().findOneBy({ id: reset.userId })
  if (!user) {
    await resetRepo().delete({ id: reset.id })
    throw invalid()
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10)
  await userRepo().save(user)
  await resetRepo().delete({ id: reset.id })
  await sessionRepo().delete({ userId: user.id })
}
