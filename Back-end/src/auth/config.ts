// Auth settings, overridable via env. Set strong secrets in production (Render).
export const authConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
  // Access token lifetime (seconds). Short-lived; refreshed via the session token.
  accessTtlSeconds: Number(process.env.ACCESS_TTL_SECONDS) || 15 * 60,
  // Refresh/session token lifetime (days).
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS) || 7,
  // Seed admin (created on first boot if missing).
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@replaygear.com',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  adminName: process.env.ADMIN_NAME ?? 'Store Admin',
}
