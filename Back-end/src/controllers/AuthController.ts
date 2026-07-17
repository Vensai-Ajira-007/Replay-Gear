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

  // GET /api/auth/me  → current user (requires a valid access token)
  @Get('/me')
  @Authorized()
  async me(@CurrentUser() current: AccessPayload) {
    const user = await getUserById(current.sub)
    if (!user) return { user: null }
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }
  }
}
