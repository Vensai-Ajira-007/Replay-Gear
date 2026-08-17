/**
 * Fetch a short blurb for a product from its Wikipedia article, at runtime.
 *
 * The seeded catalog gets its descriptions from scripts/fetch-wikipedia.mjs,
 * which runs offline and bakes the text into products.seed.sql. That script
 * can't help an admin adding a product through the UI, so this module does the
 * same job for one article on demand.
 *
 * Every failure resolves to null rather than throwing: an admin must still be
 * able to add a product when Wikipedia is slow, blocked or down.
 */

const SUMMARY_API = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
const UA = 'ReplayGear/1.0 (demo store) node-fetch'
const TIMEOUT_MS = Number(process.env.WIKIPEDIA_TIMEOUT_MS) || 8000
const MAX_CHARS = 300

/**
 * Article title out of a Wikipedia URL. Accepts the /wiki/<Title> form and the
 * older ?title=<Title> query form, on any language subdomain.
 * Returns null for anything that isn't a Wikipedia article URL.
 */
export function articleTitleFromUrl(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  if (!/(^|\.)wikipedia\.org$/i.test(url.hostname)) return null

  const fromPath = url.pathname.match(/^\/wiki\/(.+)$/)
  const title = fromPath ? fromPath[1] : url.searchParams.get('title')
  if (!title) return null

  // Drop a #section anchor; the summary endpoint wants the bare title.
  return decodeURIComponent(title).split('#')[0].trim() || null
}

// Periods that end an abbreviation rather than a sentence. Splitting naively on
// "." mangles names — "George R. R. Martin" becomes "George R. R." — so these
// are masked before the split and restored after.
const NON_TERMINAL =
  /\b([A-Z]|Ltd|Inc|Co|Corp|Jr|Sr|St|Mr|Mrs|Ms|Dr|Prof|Mt|vs|etc|No|Bros|Vol|Est)\./g
/** Sentinel standing in for a non-terminal period. Never occurs in article text. */
const DOT = '␞'

/**
 * First one or two sentences, capped — a short attributed quote, not the lead.
 * Kept identical to trimExtract in scripts/fetch-wikipedia.mjs so blurbs added
 * through the admin UI read the same as the seeded ones.
 */
export function trimExtract(extract: string): string {
  const clean = (extract || '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const masked = clean.replace(NON_TERMINAL, `$1${DOT}`)
  const unmask = (s: string) => s.split(DOT).join('.')

  const sentences = masked.match(/[^.!?]+[.!?]+(\s|$)/g) || [masked]
  let out = unmask(sentences[0] ?? '').trim()
  if (out.length < 160 && sentences[1]) out = `${out} ${unmask(sentences[1]).trim()}`

  if (out.length > MAX_CHARS) {
    const cut = out.lastIndexOf(' ', MAX_CHARS - 1)
    out = `${out.slice(0, cut > 0 ? cut : MAX_CHARS - 1).replace(/[,;:]$/, '')}…`
  }
  return out
}

/**
 * A trimmed blurb for a Wikipedia article URL, or null if it can't be had.
 *
 * Disambiguation pages are rejected — their extract describes the page itself
 * ("X may refer to:"), which is useless as a product description.
 */
export async function fetchWikipediaSummary(
  articleUrl: string,
): Promise<string | null> {
  const title = articleTitleFromUrl(articleUrl)
  if (!title) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(
      SUMMARY_API + encodeURIComponent(title.replace(/ /g, '_')),
      {
        signal: controller.signal,
        headers: { 'User-Agent': UA, accept: 'application/json' },
      },
    )
    if (!res.ok) return null

    const data = (await res.json()) as {
      type?: string
      extract?: string
    }
    if (data.type === 'disambiguation') return null

    return trimExtract(data.extract ?? '') || null
  } catch {
    // Timeout, DNS, rate limit, bad JSON — all mean "no blurb this time".
    return null
  } finally {
    clearTimeout(timer)
  }
}
