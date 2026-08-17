import {
  Authorized,
  Body,
  CurrentUser,
  Get,
  HttpCode,
  JsonController,
  Post,
} from 'routing-controllers'
import type { AccessPayload } from '../auth/tokens.js'
import {
  changePassword,
  getUserById,
  login,
  logout,
  refresh,
  register,
  requestPasswordReset,
  resetPassword,
  toPublic,
  updateDefaultAddress,
  verifyPasswordResetOtp,
} from '../services/auth.js'

interface RegisterBody {
  name?: string
  email?: string
  password?: string
}
interface LoginBody {
  email?: string
  password?: string
}
interface RefreshBody {
  refreshToken?: string
}
interface ChangePasswordBody {
  currentPassword?: string
  newPassword?: string
}
interface ForgotPasswordBody {
  email?: string
}
interface VerifyOtpBody {
  email?: string
  code?: string
}
interface ResetPasswordBody {
  resetToken?: string
  newPassword?: string
}
interface AddressBody {
  // Validated by parseDeliveryAddress in the service.
  deliveryAddress?: unknown
}

@JsonController('/auth')
export class AuthController {
  // POST /api/auth/register  → create a customer account
  @Post('/register')
  @HttpCode(201)
  async register(@Body() body: RegisterBody) {
    return register(body)
  }

  // POST /api/auth/login
  @Post('/login')
  async login(@Body() body: LoginBody) {
    return login(body)
  }

  // POST /api/auth/refresh  → rotate session, return new tokens
  @Post('/refresh')
  async refresh(@Body() body: RefreshBody) {
    return refresh(body?.refreshToken)
  }

  // POST /api/auth/logout  → revoke the session token
  @Post('/logout')
  async logout(@Body() body: RefreshBody) {
    await logout(body?.refreshToken)
    return { ok: true }
  }

  // POST /api/auth/change-password  → change the current user's password
  @Post('/change-password')
  @Authorized()
  async changePassword(
    @Body() body: ChangePasswordBody,
    @CurrentUser() current: AccessPayload,
  ) {
    await changePassword(
      current.sub,
      body.currentPassword ?? '',
      body.newPassword ?? '',
    )
    return { ok: true }
  }

  // POST /api/auth/forgot-password  → email a 6-digit OTP
  // Always { ok: true }, even for an unknown address, so the response can't be
  // used to test which emails are registered.
  @Post('/forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordBody) {
    await requestPasswordReset(body?.email)
    return { ok: true }
  }

  // POST /api/auth/verify-otp  → exchange the OTP for a one-time reset token
  @Post('/verify-otp')
  async verifyOtp(@Body() body: VerifyOtpBody) {
    return verifyPasswordResetOtp(body?.email, body?.code)
  }

  // POST /api/auth/reset-password  → set the new password, revoke all sessions
  @Post('/reset-password')
  async resetPassword(@Body() body: ResetPasswordBody) {
    await resetPassword(body?.resetToken, body?.newPassword)
    return { ok: true }
  }

  // POST /api/auth/address  → save the current user's default delivery address
  @Post('/address')
  @Authorized()
  async saveAddress(
    @Body() body: AddressBody,
    @CurrentUser() current: AccessPayload,
  ) {
    const user = await updateDefaultAddress(current.sub, body?.deliveryAddress)
    return { user: toPublic(user) }
  }

  // GET /api/auth/me  → current user (requires a valid access token)
  // Uses toPublic so this can't drift from the login/register user payload.
  @Get('/me')
  @Authorized()
  async me(@CurrentUser() current: AccessPayload) {
    const user = await getUserById(current.sub)
    if (!user) return { user: null }
    return { user: toPublic(user) }
  }
}
