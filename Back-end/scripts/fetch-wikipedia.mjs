#!/usr/bin/env node
/**
 * One-off generator: pulls a short summary + article URL for every seeded product
 * from Wikipedia's REST summary API and bakes them into products.seed.sql.
 *
 * Deliberately NOT part of server boot. Wikipedia rate-limits hard (44 rapid
 * requests gets a sustained 429), so this runs offline, throttled, once — and
 * caches to scripts/wikipedia-data.json so re-runs don't re-hit the API.
 *
 *   npm run wiki:fetch            # fetch (uses cache) + rewrite the seed
 *   npm run wiki:fetch -- --force # ignore the cache and refetch everything
 *
 * Only the first sentence or two of each article is stored, and the product page
 * credits Wikipedia with a link back (CC BY-SA).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SEED_PATH = join(HERE, '..', 'src', 'db', 'products.seed.sql')
const CACHE_PATH = join(HERE, 'wikipedia-data.json')

const API = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
const UA = 'ReplayGear/1.0 (demo store; local dev) node-fetch'
const DELAY_MS = 1500
const MAX_CHARS = 300

// id -> catalog title, mirroring products.seed.sql.
const PRODUCTS = [
  [1, 'Elden Ring'],
  [2, 'God of War Ragnarök'],
  [3, 'The Legend of Zelda: Tears of the Kingdom'],
  [4, 'Mario Kart 8 Deluxe'],
  [5, 'Halo Infinite'],
  [6, 'Cyberpunk 2077'],
  [7, 'Forza Horizon 5'],
  [8, 'Baldur’s Gate 3'],
  [9, 'PlayStation 5 (Slim)'],
  [10, 'Xbox Series X'],
  [11, 'Nintendo Switch OLED'],
  [12, 'PlayStation 4 Slim'],
  [13, 'Xbox Series S'],
  [14, 'Red Dead Redemption 2'],
  [15, 'The Witcher 3: Wild Hunt'],
  [16, 'Grand Theft Auto V'],
  [17, 'Hogwarts Legacy'],
  [18, 'Sekiro: Shadows Die Twice'],
  [19, 'Hades'],
  [20, 'Doom Eternal'],
  [21, 'Resident Evil 4'],
  [22, 'Marvel’s Spider-Man Remastered'],
  [23, 'Horizon Zero Dawn'],
  [24, 'Death Stranding'],
  [25, 'Monster Hunter: World'],
  [26, 'Control'],
  [27, 'Hollow Knight'],
  [28, 'Celeste'],
  [29, 'Cuphead'],
  [30, 'The Last of Us Part I'],
  [31, 'Starfield'],
  [32, 'Lies of P'],
  [33, 'Street Fighter 6'],
  [34, 'Devil May Cry 5'],
  [35, 'Stardew Valley'],
  [36, 'Super Mario Odyssey'],
  [37, 'Animal Crossing: New Horizons'],
  [38, 'Super Smash Bros. Ultimate'],
  [39, 'Splatoon 3'],
  [40, 'Nintendo Switch'],
  [41, 'Nintendo Switch Lite'],
  [42, 'Xbox One X'],
  [43, 'PlayStation 3 Super Slim'],
  [44, 'Steam Deck'],
]

/**
 * Titles whose article name differs from the product name. Without these the
 * derived URL 404s ("PlayStation 5 (Slim)") or silently lands on the wrong
 * subject ("Hades" is the Greek god; "Control"/"Celeste"/"Starfield" are
 * disambiguation-prone common words).
 */
const OVERRIDES = {
  9: 'PlayStation 5',
  11: 'Nintendo Switch OLED Model',
  12: 'PlayStation 4',
  19: 'Hades (video game)',
  21: 'Resident Evil 4 (2023 video game)', // the seed's cover art is the remake
  22: "Marvel's Spider-Man (video game)",
  26: 'Control (video game)',
  28: 'Celeste (video game)',
  31: 'Starfield (video game)',
  42: 'Xbox One',
  43: 'PlayStation 3',
}

/**
 * Store-written descriptions for console revisions that have no article of their
 * own — they redirect to the family article, which would otherwise give sibling
 * models byte-identical text. The Wikipedia link still points at the family
 * article; only the blurb is ours.
 */
const DESCRIPTION_OVERRIDES = {
  11: 'The 2021 revision of the Nintendo Switch, with a larger 7-inch OLED screen, a wider adjustable stand and 64 GB of internal storage.',
  13: 'The smaller, all-digital member of the Xbox Series family: no disc drive, a lower target resolution than the Series X, and a much smaller footprint.',
  41: 'A lighter, handheld-only Nintendo Switch with the controls built in. It does not dock to a TV.',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function articleSlug(title) {
  // Wikipedia uses straight apostrophes; accents encode fine as UTF-8.
  return encodeURIComponent(title.replace(/’/g, "'").replace(/ /g, '_'))
}

/**
 * First one or two sentences, capped — a short attributed quote, not the lead.
 *
 * Naive splitting on "." breaks names and abbreviations ("George R. R. Martin"
 * became "George R. R.", and Remedy's "Control ... Entertainment. S." lost the
 * rest), so periods that are not sentence ends are masked before splitting.
 */
const NON_TERMINAL = /\b([A-Z]|Ltd|Inc|Co|Corp|Jr|Sr|St|Mr|Mrs|Ms|Dr|Prof|Mt|vs|etc|No|Bros|Vol|Est)\./g
// Sentinel standing in for a non-terminal period while splitting. Must never
// occur in article text.
const DOT = '\u241E'

function trimExtract(extract) {
  const clean = (extract || '').replace(/\s+/g, ' ').trim()
  if (!clean) return ''
  const masked = clean.replace(NON_TERMINAL, `$1${DOT}`)
  const unmask = (s) => s.split(DOT).join('.')

  const sentences = masked.match(/[^.!?]+[.!?]+(\s|$)/g) || [masked]
  let out = unmask(sentences[0] ?? '').trim()
  if (out.length < 160 && sentences[1]) out = `${out} ${unmask(sentences[1]).trim()}`

  if (out.length > MAX_CHARS) {
    const cut = out.lastIndexOf(' ', MAX_CHARS - 1)
    out = `${out.slice(0, cut > 0 ? cut : MAX_CHARS - 1).replace(/[,;:]$/, '')}…`
  }
  return out
}

async function fetchSummary(title) {
  const url = API + articleSlug(title)
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, accept: 'application/json' } })
    if (res.status === 429 || res.status === 503) {
      const wait = Math.min(60000, 3000 * 2 ** attempt)
      process.stdout.write(` [${res.status}, waiting ${Math.round(wait / 1000)}s]`)
      await sleep(wait)
      continue
    }
    if (!res.ok) return { error: `HTTP ${res.status}` }
    const data = await res.json()
    return {
      type: data.type,
      article: data.title,
      canonical:
        data.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${articleSlug(data.title)}`,
      extract: data.extract,
    }
  }
  return { error: 'rate limited after retries' }
}

async function gather(force) {
  const cache = !force && existsSync(CACHE_PATH)
    ? JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
    : {}
  const rows = []
  let fetched = 0

  // Build a row from a cache entry. The cache holds the RAW extract, never the
  // trimmed text, so changing trimExtract takes effect without refetching.
  const toRow = (id, title, entry) => ({
    id,
    title,
    ...entry,
    storeWritten: DESCRIPTION_OVERRIDES[id] !== undefined,
    description:
      DESCRIPTION_OVERRIDES[id] ??
      (entry.extract ? trimExtract(entry.extract) : null),
  })

  for (const [id, title] of PRODUCTS) {
    const requested = OVERRIDES[id] ?? title
    // `extract` is required: entries cached by an older version of this script
    // stored only trimmed text, so they count as stale and get refetched.
    if (
      cache[id] &&
      cache[id].requested === requested &&
      !cache[id].error &&
      cache[id].extract
    ) {
      rows.push(toRow(id, title, cache[id]))
      continue
    }
    process.stdout.write(`  [${String(id).padStart(2)}] ${title} …`)
    const r = await fetchSummary(requested)
    fetched++
    const entry = {
      requested,
      overridden: OVERRIDES[id] !== undefined,
      article: r.article ?? null,
      url: r.canonical ?? null,
      extract: r.extract ?? null,
      type: r.type ?? null,
      error: r.error ?? null,
    }
    cache[id] = entry
    rows.push(toRow(id, title, entry))
    process.stdout.write(r.error ? ` ${r.error}\n` : ` ok\n`)
    await sleep(DELAY_MS)
  }

  if (fetched > 0) {
    mkdirSync(dirname(CACHE_PATH), { recursive: true })
    writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n')
  }
  return rows
}

function report(rows) {
  console.log(
    `\n${'ID'.padStart(3)}  ${'CATALOG TITLE'.padEnd(42)} ${'STATUS'.padEnd(10)} ${'ARTICLE'.padEnd(36)} CHARS`,
  )
  console.log('-'.repeat(104))
  const problems = []
  for (const r of rows) {
    let status
    if (r.error) {
      status = r.error
      problems.push(`${r.id} ${r.title}: ${r.error}`)
    } else if (r.type !== 'standard') {
      status = (r.type || '?').toUpperCase()
      problems.push(`${r.id} ${r.title}: type=${r.type}`)
    } else if (r.overridden) {
      status = 'override'
    } else if (
      r.article?.toLowerCase().replace(/\s/g, '') !==
      r.title.toLowerCase().replace(/\s/g, '').replace(/’/g, "'")
    ) {
      status = 'redirect'
      problems.push(`${r.id} ${r.title}: redirected to "${r.article}" — confirm this is right`)
    } else {
      status = 'exact'
    }
    console.log(
      `${String(r.id).padStart(3)}  ${r.title.padEnd(42)} ${status.padEnd(10)} ${(r.article ?? '-').padEnd(36)} ${r.description?.length ?? 0}`,
    )
  }
  console.log('-'.repeat(104))

  // Identical descriptions across products (e.g. Xbox Series X / Series S share
  // one article) are legal but read badly on the storefront.
  const byDesc = new Map()
  for (const r of rows) {
    if (!r.description) continue
    byDesc.set(r.description, [...(byDesc.get(r.description) ?? []), `${r.id} ${r.title}`])
  }
  const dupes = [...byDesc.values()].filter((v) => v.length > 1)

  const ok = rows.filter((r) => r.description && r.url).length
  console.log(`resolved: ${ok}/${rows.length}`)
  if (dupes.length) {
    console.log('\nDUPLICATE DESCRIPTIONS (same source article):')
    for (const g of dupes) console.log(`  ${g.join('  |  ')}`)
  }
  if (problems.length) {
    console.log('\nNEEDS ATTENTION:')
    for (const p of problems) console.log(`  ${p}`)
  }
  return ok === rows.length
}

/** SQL string literal: double any straight apostrophe. */
const q = (s) => (s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`)

function rewriteSeed(rows) {
  const src = readFileSync(SEED_PATH, 'utf8')
  const byId = new Map(rows.map((r) => [r.id, r]))

  if (src.includes('wikipedia_url')) {
    console.log('\nseed already has wikipedia_url — regenerating those columns')
  }

  const lines = src.split('\n')
  let touched = 0

  const out = lines.map((line) => {
    // Column list
    if (line.includes('rating, emoji, accent, image_url)')) {
      return line.replace(
        'rating, emoji, accent, image_url)',
        'rating, emoji, accent, image_url, description, wikipedia_url)',
      )
    }
    // ON CONFLICT list — append after the image_url assignment.
    if (/^\s*image_url\s*=\s*EXCLUDED\.image_url;/.test(line)) {
      return (
        '  image_url      = EXCLUDED.image_url,\n' +
        '  description    = EXCLUDED.description,\n' +
        '  wikipedia_url  = EXCLUDED.wikipedia_url;'
      )
    }
    // A VALUES row: "  (<id>, '<title>', ... )" with optional trailing comma.
    const m = line.match(/^(\s*\()(\d+),\s*'(.*)$/)
    if (!m) return line
    const id = Number(m[2])
    const row = byId.get(id)
    if (!row) return line
    const tail = line.match(/\)(,?)\s*$/)
    if (!tail) return line

    // Strip any previously-appended description/url so re-runs are idempotent.
    let body = line.slice(0, line.length - tail[0].length)
    body = body.replace(/,\s*(?:'(?:[^']|'')*'|NULL),\s*(?:'(?:[^']|'')*'|NULL)$/, (match) =>
      /https:\/\/en\.wikipedia\.org\/wiki\//.test(match) ? '' : match,
    )

    touched++
    return `${body}, ${q(row.description)}, ${q(row.url)})${tail[1]}`
  })

  if (touched !== rows.length) {
    console.error(
      `\nABORT: rewrote ${touched} value rows but expected ${rows.length}. Seed left untouched.`,
    )
    process.exit(1)
  }

  writeFileSync(SEED_PATH, out.join('\n'))
  console.log(`\nwrote ${touched} rows to ${SEED_PATH}`)
}

const force = process.argv.includes('--force')
const writeSeed = !process.argv.includes('--dry-run')

console.log(`Fetching Wikipedia summaries for ${PRODUCTS.length} products…\n`)
const rows = await gather(force)
const complete = report(rows)

if (!writeSeed) {
  console.log('\n--dry-run: seed not modified')
} else if (!complete) {
  console.error('\nNot all products resolved — seed NOT modified. Fix OVERRIDES and re-run.')
  process.exit(1)
} else {
  rewriteSeed(rows)
}
