#!/usr/bin/env node
/**
 * Diagnostic: print the live Steam INR price for every appid in the seed, without
 * starting the server or touching the database.
 *
 *   npm run steam:check
 *
 * Useful for confirming coverage and spotting titles that have gone delisted
 * (Steam answers success:true with an empty data array for those).
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SEED = join(HERE, '..', 'src', 'db', 'products.seed.sql')
const CC = process.env.STEAM_CC ?? 'in'

const sql = readFileSync(SEED, 'utf8')

// Pull "(<id>, '<title>', ... , <appid|NULL>)" from each VALUES row.
const rows = []
for (const line of sql.split('\n')) {
  const head = line.match(/^\s*\((\d+),\s*'((?:[^']|'')*)'/)
  const tail = line.match(/,\s*(\d+|NULL)\)\s*,?\s*$/)
  if (!head || !tail) continue
  rows.push({
    id: Number(head[1]),
    title: head[2].replace(/''/g, "'"),
    appid: tail[1] === 'NULL' ? null : Number(tail[1]),
  })
}

const withAppid = rows.filter((r) => r.appid)
console.log(
  `seed rows: ${rows.length} | with appid: ${withAppid.length} | without: ${
    rows.length - withAppid.length
  }\n`,
)

if (withAppid.length === 0) process.exit(0)

const url =
  `https://store.steampowered.com/api/appdetails?appids=${withAppid
    .map((r) => r.appid)
    .join(',')}&cc=${encodeURIComponent(CC)}&filters=price_overview`

const res = await fetch(url, { headers: { accept: 'application/json' } })
if (!res.ok) {
  console.error(`Steam API ${res.status}`)
  process.exit(1)
}
const body = await res.json()

const money = (paise) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100)

let priced = 0
const unpriced = []
console.log(
  `${'ID'.padStart(3)}  ${'TITLE'.padEnd(38)} ${'APPID'.padStart(8)}  ${'PRICE'.padStart(10)}  WAS`,
)
console.log('-'.repeat(84))
for (const r of withAppid) {
  const entry = body[String(r.appid)]
  const data = entry?.success && !Array.isArray(entry.data) ? entry.data : null
  const po = data?.price_overview
  if (!po) {
    unpriced.push(r)
    console.log(
      `${String(r.id).padStart(3)}  ${r.title.padEnd(38)} ${String(r.appid).padStart(8)}  ${'—'.padStart(10)}  (no price)`,
    )
    continue
  }
  priced++
  const was = po.initial > po.final ? `${money(po.initial)}  -${po.discount_percent}%` : ''
  console.log(
    `${String(r.id).padStart(3)}  ${r.title.padEnd(38)} ${String(r.appid).padStart(8)}  ${money(po.final).padStart(10)}  ${was}`,
  )
}
console.log('-'.repeat(84))
console.log(`priced: ${priced}/${withAppid.length}  (${rows.length} products total)`)
if (unpriced.length) {
  console.log('\nNo Steam price — these keep their stored price:')
  for (const r of unpriced) console.log(`  ${r.id} ${r.title} (appid ${r.appid})`)
}
