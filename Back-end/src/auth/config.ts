// Auth settings, overridable via env. Set strong secrets in production (Render).
export const authConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
  // Access token lifetime (seconds). Short-lived; refreshed via the session token.
  accessTtlSeconds: Number(process.env.ACCESS_TTL_SECONDS) || 15 * 60,
  // Refresh/session token lifetime (days).
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS) || 7,
  // Forgot-password OTP: how long the emailed code is valid (minutes) and how
  // many wrong guesses it survives before the whole attempt is discarded.
  resetOtpTtlMinutes: Number(process.env.RESET_OTP_TTL_MINUTES) || 10,
  resetOtpMaxAttempts: Number(process.env.RESET_OTP_MAX_ATTEMPTS) || 5,
  // Lifetime (minutes) of the one-time token handed out once the OTP verifies.
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES) || 10,
  // Minimum gap between OTP emails for one account — there is no rate limiter
  // in front of the API, so this is what stops a known address being mail-bombed.
  resetOtpResendSeconds: Number(process.env.RESET_OTP_RESEND_SECONDS) || 60,
  // Seed admin (created on first boot if missing).
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@replaygear.com',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  adminName: process.env.ADMIN_NAME ?? 'Store Admin',
}
