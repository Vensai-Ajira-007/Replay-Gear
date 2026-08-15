// Live Steam pricing, overridable via env. Set STEAM_PRICING=false to fall back
// to the prices stored in the products table.
export const steamConfig = {
  // On by default; the kill switch for when Steam is unreachable or unwanted.
  enabled: process.env.STEAM_PRICING !== 'false',
  // Storefront country — drives the currency (in = INR).
  countryCode: process.env.STEAM_CC ?? 'in',
  // How long a fetched price stays fresh. Steam serves Cache-Control max-age=3600,
  // so an hour matches what the storefront itself expects.
  cacheTtlSeconds: Number(process.env.STEAM_CACHE_TTL_SECONDS) || 3600,
  // Give up rather than hold a catalog request open if Steam is slow.
  timeoutMs: Number(process.env.STEAM_TIMEOUT_MS) || 8000,
}
