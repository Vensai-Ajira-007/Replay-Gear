import { steamConfig } from '../steam/config.js'

/**
 * Live INR prices from Steam's storefront endpoint, cached in memory.
 *
 *   GET store.steampowered.com/api/appdetails?appids=<csv>&cc=in&filters=price_overview
 *
 * The endpoint accepts every appid in one request and answers with
 * Cache-Control: max-age=3600, so we refresh the whole catalog in a single call
 * once an hour. That matters: getCart() looks products up one at a time in a
 * loop, so a per-appid fetch would turn one cart render into N round-trips.
 *
 * Nothing here throws. If Steam is slow, down, or rate-limiting, callers get
 * whatever is cached (possibly nothing) and products keep their stored prices.
 */

export interface SteamPrice {
  /** Current price in rupees. */
  final: number
  /** Pre-discount price in rupees; equals `final` outside a sale. */
  initial: number
  discountPercent: number
}

// appid -> price, or null meaning "Steam has no price for this" (delisted,
// free-to-play, unknown id). Caching the negative stops us asking again every
// hour for the handful of titles that will never answer.
const cache = new Map<number, SteamPrice | null>()
let lastRefresh = 0
let inFlight: Promise<void> | null = null

const API = 'https://store.steampowered.com/api/appdetails'

function isFresh(): boolean {
  return Date.now() - lastRefresh < steamConfig.cacheTtlSeconds * 1000
}

/** Steam reports money in paise; a non-positive value means "no real price". */
function toRupees(paise: unknown): number | null {
  const n = Number(paise)
  return Number.isFinite(n) && n > 0 ? n / 100 : null
}

async function refresh(appids: number[]): Promise<void> {
  const url = `${API}?appids=${appids.join(',')}&cc=${encodeURIComponent(
    steamConfig.countryCode,
  )}&filters=price_overview`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), steamConfig.timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Steam API ${res.status}`)
    const body = (await res.json()) as Record<string, unknown>

    let priced = 0
    for (const appid of appids) {
      const entry = body[String(appid)] as
        | { success?: boolean; data?: unknown }
        | undefined
      // A delisted or free app answers success:true with an empty array.
      const data =
        entry?.success && entry.data && !Array.isArray(entry.data)
          ? (entry.data as { price_overview?: Record<string, unknown> })
          : null
      const po = data?.price_overview

      const final = po ? toRupees(po.final) : null
      const initial = po ? toRupees(po.initial) : null

      if (final === null) {
        cache.set(appid, null)
        continue
      }
      cache.set(appid, {
        final,
        // Outside a sale Steam repeats the final price as the initial one.
        initial: initial !== null && initial >= final ? initial : final,
        discountPercent: Number(po?.discount_percent) || 0,
      })
      priced++
    }

    lastRefresh = Date.now()
    console.log(`💰 Steam prices refreshed — ${priced}/${appids.length} priced`)
  } catch (err) {
    // Deliberately swallowed: a pricing outage must not break the catalog.
    // Don't advance lastRefresh, so the next request retries.
    const reason = err instanceof Error ? err.message : String(err)
    console.error(`Steam price refresh failed (${reason}) — using stored prices`)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Prices for the given appids. Refreshes the whole set in one call when the
 * cache is stale or is missing any of them. Concurrent callers share the same
 * in-flight request rather than each hitting Steam.
 */
export async function getSteamPrices(
  appids: number[],
): Promise<Map<number, SteamPrice>> {
  const wanted = [...new Set(appids)].filter((id) => Number.isInteger(id) && id > 0)
  const result = new Map<number, SteamPrice>()
  if (!steamConfig.enabled || wanted.length === 0) return result

  const missing = wanted.some((id) => !cache.has(id))
  if (missing || !isFresh()) {
    // Refresh everything we know about, not just this request's ids, so a single
    // product page warms the cache for the whole catalog.
    const all = [...new Set([...cache.keys(), ...wanted])]
    inFlight ??= refresh(all).finally(() => {
      inFlight = null
    })
    await inFlight
  }

  for (const id of wanted) {
    const hit = cache.get(id)
    if (hit) result.set(id, hit)
  }
  return result
}
